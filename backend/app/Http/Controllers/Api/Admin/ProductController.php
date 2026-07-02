<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DrugInteraction;
use App\Models\InventoryBatch;
use App\Models\Product;
use App\Models\ProductAlternative;
use App\Services\AdminActivityService;
use App\Services\DrugInteractionService;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $products = Product::query()
            ->with([
                'category:id,category_name',
                'manufacturer:id,manufacturer_name',
                'images',
                'batches' => fn ($query) => $query
                    ->orderByRaw("CASE WHEN status = 'active' AND expiry_date > CURDATE() AND (stock_quantity - reserved_quantity) > 0 THEN 0 ELSE 1 END")
                    ->orderBy('expiry_date'),
            ])
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('product_name', 'like', "%{$search}%")
                ->orWhere('generic_name', 'like', "%{$search}%")
                ->orWhere('brand_name', 'like', "%{$search}%")))
            ->when($request->category_id, fn ($query, $id) => $query->where('category_id', $id))
            ->when($request->manufacturer_id, fn ($query, $id) => $query->where('manufacturer_id', $id))
            ->when($request->filled('status'), fn ($query) => $query->where('is_active', $request->input('status') === 'active'))
            ->when($request->filled('prescription'), fn ($query) => $query->where('requires_prescription', $request->input('prescription') === 'required'))
            ->orderBy('product_name')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($products, 'Product list retrieved.');
    }

    public function store(Request $request, AdminActivityService $activity, InventoryService $inventory, DrugInteractionService $interactionService)
    {
        $data = $this->validated($request);
        $batchData = $this->initialBatchData($data);
        $alternativeIds = $data['alternative_product_ids'] ?? [];
        $interactionData = $data['drug_interactions'] ?? [];
        unset($data['alternative_product_ids'], $data['drug_interactions']);

        $product = DB::transaction(function () use ($data, $batchData, $activity, $inventory, $request, $alternativeIds, $interactionData, $interactionService) {
            $product = Product::create($data);
            $this->createInitialBatch($product, $batchData, $inventory);
            $this->syncAlternatives($product, $alternativeIds);
            $this->syncDrugInteractions($product, $interactionData, $interactionService);
            $activity->log($request, 'create', 'product', $product->id, null, $product->toArray());

            return $product;
        });

        return $this->ok($this->productPayload($product), 'Product created.', 201);
    }

    public function show(int $id, DrugInteractionService $interactionService)
    {
        return $this->ok($this->productPayload(Product::findOrFail($id), $interactionService), 'Product details retrieved.');
    }

    public function update(Request $request, int $id, AdminActivityService $activity, InventoryService $inventory, DrugInteractionService $interactionService)
    {
        $product = Product::findOrFail($id);
        $old = $product->toArray();
        $data = $this->validated($request);
        $batchData = $this->initialBatchData($data);
        $alternativeIds = $data['alternative_product_ids'] ?? [];
        $interactionData = $data['drug_interactions'] ?? [];
        unset($data['alternative_product_ids'], $data['drug_interactions']);

        DB::transaction(function () use ($product, $data, $batchData, $activity, $inventory, $request, $old, $alternativeIds, $interactionData, $interactionService) {
            $product->update($data);
            $this->createInitialBatch($product, $batchData, $inventory);
            $this->syncAlternatives($product, $alternativeIds);
            $this->syncDrugInteractions($product, $interactionData, $interactionService);
            $activity->log($request, 'update', 'product', $product->id, $old, $product->fresh()->toArray());
        });

        return $this->ok($this->productPayload($product, $interactionService), 'Product updated.');
    }

    public function generateDescriptionDraft(int $id, AdminActivityService $activity, Request $request)
    {
        $product = Product::with('category', 'manufacturer')->findOrFail($id);
        $draft = $this->buildLocalDescriptionDraft($product);
        $old = $product->only(['description_draft', 'description_bn_draft', 'description_draft_status', 'description_generated_at']);

        $product->update([
            'description_draft' => $draft,
            'description_bn_draft' => $product->description_bn_draft,
            'description_draft_status' => 'pending_review',
            'description_generated_at' => now(),
        ]);

        $activity->log($request, 'generate_description_draft', 'product', $product->id, $old, $product->fresh()->only(['description_draft', 'description_draft_status', 'description_generated_at']));

        return $this->ok($this->productPayload($product), 'Description draft generated for admin review.');
    }

    public function publishDescriptionDraft(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'description_draft' => ['required', 'string'],
            'description_bn_draft' => ['nullable', 'string'],
        ]);
        $product = Product::findOrFail($id);
        $old = $product->only(['description', 'description_bn', 'description_draft', 'description_bn_draft', 'description_draft_status']);

        $product->update([
            'description' => trim($data['description_draft']),
            'description_bn' => isset($data['description_bn_draft']) && trim($data['description_bn_draft']) !== ''
                ? trim($data['description_bn_draft'])
                : $product->description_bn,
            'description_draft' => null,
            'description_bn_draft' => null,
            'description_draft_status' => 'published',
        ]);

        $activity->log($request, 'publish_description_draft', 'product', $product->id, $old, $product->fresh()->only(['description', 'description_bn', 'description_draft_status']));

        return $this->ok($this->productPayload($product), 'Description draft published.');
    }

    public function discardDescriptionDraft(Request $request, int $id, AdminActivityService $activity)
    {
        $product = Product::findOrFail($id);
        $old = $product->only(['description_draft', 'description_bn_draft', 'description_draft_status']);

        $product->update([
            'description_draft' => null,
            'description_bn_draft' => null,
            'description_draft_status' => 'discarded',
        ]);

        $activity->log($request, 'discard_description_draft', 'product', $product->id, $old, $product->fresh()->only(['description_draft_status']));

        return $this->ok($this->productPayload($product), 'Description draft discarded.');
    }

    public function status(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $product = Product::findOrFail($id);
        $old = ['is_active' => $product->is_active];
        $product->update($data);
        $activity->log($request, 'status', 'product', $product->id, $old, ['is_active' => $product->is_active]);

        return $this->ok($product, 'Product status updated.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $product = Product::with('images')->findOrFail($id);
        $old = $product->toArray();
        $product->delete();
        $activity->log($request, 'delete', 'product', $id, $old);

        return $this->ok(null, 'Product deleted.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'manufacturer_id' => ['required', 'exists:manufacturers,id'],
            'product_type' => ['nullable', 'in:medicine,healthcare,device,personal_care,beauty,baby_care'],
            'product_name' => ['required', 'string', 'max:255'],
            'generic_name' => ['nullable', 'string', 'max:255'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'strength' => ['nullable', 'string', 'max:100'],
            'dosage_form' => ['nullable', 'string', 'max:100'],
            'package_unit' => ['nullable', 'in:piece,pack,packet,bottle,kit,device,tube,jar,box,unit'],
            'package_size' => ['nullable', 'string', 'max:120'],
            'pieces_per_strip' => ['required', 'integer', 'min:1'],
            'strips_per_box' => ['required', 'integer', 'min:1'],
            'strip_price' => ['nullable', 'numeric', 'min:0'],
            'box_price' => ['nullable', 'numeric', 'min:0'],
            'strip_discount' => ['nullable', 'numeric', 'min:0'],
            'box_discount' => ['nullable', 'numeric', 'min:0'],
            'requires_prescription' => ['required', 'boolean'],
            'description' => ['nullable', 'string'],
            'description_bn' => ['nullable', 'string'],
            'indications' => ['nullable', 'string'],
            'indications_bn' => ['nullable', 'string'],
            'pharmacology' => ['nullable', 'string'],
            'pharmacology_bn' => ['nullable', 'string'],
            'dosage_administration' => ['nullable', 'string'],
            'dosage_administration_bn' => ['nullable', 'string'],
            'interaction_details' => ['nullable', 'string'],
            'interaction_details_bn' => ['nullable', 'string'],
            'contraindications' => ['nullable', 'string'],
            'contraindications_bn' => ['nullable', 'string'],
            'side_effects' => ['nullable', 'string'],
            'side_effects_bn' => ['nullable', 'string'],
            'pregnancy_lactation' => ['nullable', 'string'],
            'pregnancy_lactation_bn' => ['nullable', 'string'],
            'precautions_warnings' => ['nullable', 'string'],
            'precautions_warnings_bn' => ['nullable', 'string'],
            'therapeutic_class' => ['nullable', 'string', 'max:255'],
            'therapeutic_class_bn' => ['nullable', 'string', 'max:255'],
            'storage_conditions' => ['nullable', 'string'],
            'storage_conditions_bn' => ['nullable', 'string'],
            'leaflet_url' => ['nullable', 'url', 'max:2048'],
            'specifications' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'initial_batch' => ['nullable', 'array'],
            'initial_batch.enabled' => ['nullable', 'boolean'],
            'initial_batch.supplier_id' => ['required_if:initial_batch.enabled,true', 'nullable', 'exists:suppliers,id'],
            'initial_batch.batch_number' => ['required_if:initial_batch.enabled,true', 'nullable', 'string', 'max:100'],
            'initial_batch.expiry_date' => ['required_if:initial_batch.enabled,true', 'nullable', 'date', 'after:today'],
            'initial_batch.manufactured_date' => ['nullable', 'date'],
            'initial_batch.purchase_price' => ['required_if:initial_batch.enabled,true', 'nullable', 'numeric', 'min:0'],
            'initial_batch.selling_price' => ['required_if:initial_batch.enabled,true', 'nullable', 'numeric', 'min:0'],
            'initial_batch.stock_quantity' => ['required_if:initial_batch.enabled,true', 'nullable', 'integer', 'min:1'],
            'alternative_product_ids' => ['nullable', 'array'],
            'alternative_product_ids.*' => ['integer', 'exists:products,id'],
            'drug_interactions' => ['nullable', 'array'],
            'drug_interactions.*.interacts_with_generic_name' => ['required_with:drug_interactions', 'string', 'max:255'],
            'drug_interactions.*.severity' => ['nullable', 'in:low,moderate,high,critical'],
            'drug_interactions.*.warning' => ['nullable', 'string'],
            'drug_interactions.*.is_active' => ['nullable', 'boolean'],
        ]);

        $data['product_type'] = $data['product_type'] ?? 'medicine';
        $data['package_unit'] = $data['product_type'] === 'medicine'
            ? 'piece'
            : (($data['package_unit'] ?? null) ?: 'pack');

        if ($data['product_type'] !== 'medicine') {
            $data['requires_prescription'] = false;
            $data['generic_name'] = null;
            $data['strength'] = null;
            $data['dosage_form'] = null;
            $data['indications'] = null;
            $data['indications_bn'] = null;
            $data['pharmacology'] = null;
            $data['pharmacology_bn'] = null;
            $data['dosage_administration'] = null;
            $data['dosage_administration_bn'] = null;
            $data['interaction_details'] = null;
            $data['interaction_details_bn'] = null;
            $data['contraindications'] = null;
            $data['contraindications_bn'] = null;
            $data['side_effects'] = null;
            $data['side_effects_bn'] = null;
            $data['pregnancy_lactation'] = null;
            $data['pregnancy_lactation_bn'] = null;
            $data['precautions_warnings'] = null;
            $data['precautions_warnings_bn'] = null;
            $data['therapeutic_class'] = null;
            $data['therapeutic_class_bn'] = null;
            $data['storage_conditions'] = null;
            $data['storage_conditions_bn'] = null;
            $data['leaflet_url'] = null;
            $data['pieces_per_strip'] = 1;
            $data['strips_per_box'] = 1;
            $data['strip_price'] = null;
            $data['box_price'] = null;
            $data['strip_discount'] = null;
            $data['box_discount'] = null;
            $data['alternative_product_ids'] = [];
            $data['drug_interactions'] = [];
        } else {
            $data['package_size'] = null;
            $data['specifications'] = null;
        }

        return $data;
    }

    private function initialBatchData(array &$data): ?array
    {
        $batch = $data['initial_batch'] ?? null;
        unset($data['initial_batch']);

        if (! is_array($batch) || ! ($batch['enabled'] ?? false)) {
            return null;
        }

        unset($batch['enabled']);
        $batch['reserved_quantity'] = 0;
        $batch['status'] = 'active';

        return $batch;
    }

    private function createInitialBatch(Product $product, ?array $batchData, InventoryService $inventory): void
    {
        if (! $batchData) {
            return;
        }

        $batch = InventoryBatch::create([
            ...$batchData,
            'product_id' => $product->id,
        ]);

        $inventory->transaction($batch->id, 'stock_in', (int) $batch->stock_quantity, 'inventory_batch', $batch->id, 'Initial stock');
    }

    private function productPayload(Product $product, ?DrugInteractionService $interactionService = null): Product
    {
        $interactionService ??= app(DrugInteractionService::class);
        $product->load('category', 'manufacturer', 'images', 'batches.supplier', 'alternatives:id,product_name,generic_name,strength,dosage_form');
        $product->setAttribute('alternative_product_ids', $product->alternatives->pluck('id')->values());
        $product->setAttribute('drug_interactions', $interactionService->displayForGeneric($product->generic_name, false));

        return $product;
    }

    private function syncAlternatives(Product $product, array $alternativeIds): void
    {
        $ids = collect($alternativeIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0 && $id !== (int) $product->id)
            ->unique()
            ->values();

        ProductAlternative::query()->where('product_id', $product->id)->delete();
        ProductAlternative::query()
            ->where('alternative_product_id', $product->id)
            ->whereNotIn('product_id', $ids->all() ?: [0])
            ->delete();

        foreach ($ids as $id) {
            ProductAlternative::updateOrCreate([
                'product_id' => $product->id,
                'alternative_product_id' => $id,
            ]);

            ProductAlternative::updateOrCreate([
                'product_id' => $id,
                'alternative_product_id' => $product->id,
            ]);
        }
    }

    private function syncDrugInteractions(Product $product, array $interactions, DrugInteractionService $service): void
    {
        $generic = $service->normalizeGeneric($product->generic_name);

        if (! $generic) {
            return;
        }

        DrugInteraction::query()
            ->where('generic_name', $generic)
            ->orWhere('interacts_with_generic_name', $generic)
            ->delete();

        foreach ($interactions as $interaction) {
            $other = $interaction['interacts_with_generic_name'] ?? '';
            $pair = $service->normalizedPair($generic, $other);

            if (! $pair) {
                continue;
            }

            DrugInteraction::updateOrCreate([
                'generic_name' => $pair[0],
                'interacts_with_generic_name' => $pair[1],
            ], [
                'severity' => $interaction['severity'] ?? 'moderate',
                'warning' => trim((string) ($interaction['warning'] ?? '')) ?: null,
                'is_active' => (bool) ($interaction['is_active'] ?? true),
            ]);
        }
    }

    private function buildLocalDescriptionDraft(Product $product): string
    {
        $parts = array_filter([
            $product->product_name,
            $product->strength,
            $product->dosage_form,
        ]);
        $name = implode(' ', $parts) ?: 'This medicine';
        $generic = $product->generic_name ? " It contains {$product->generic_name} as the generic ingredient." : '';
        $category = $product->category?->category_name ? " It belongs to the {$product->category->category_name} category." : '';
        $manufacturer = $product->manufacturer?->manufacturer_name ? " It is supplied by {$product->manufacturer->manufacturer_name}." : '';
        $prescription = $product->requires_prescription
            ? ' This item requires a valid prescription and pharmacist review before order confirmation.'
            : ' This item can be ordered without uploading a prescription unless a pharmacist advises otherwise.';

        return "{$name} is listed in the pharmacy catalog.{$generic}{$category}{$manufacturer}{$prescription} Use only as directed on the label or by a qualified healthcare professional.";
    }
}
