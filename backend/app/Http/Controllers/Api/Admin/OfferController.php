<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OfferController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Offer::query()
            ->with('category:id,category_name', 'manufacturer:id,manufacturer_name')
            ->orderBy('sort_order')
            ->orderBy('id');
        if ($request->filled('status')) $query->where('status', $request->string('status')->toString());

        return $this->ok($query->get(), 'Offers loaded successfully.');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $this->applyImage($request, $this->validated($request));
        $this->clearDisplaySelections($data);
        $offer = Offer::create($data);
        $activity->log($request, 'create', 'offers', $offer->id, null, $offer->toArray());

        return $this->ok($offer->fresh(), 'Offer created successfully.', 201);
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $offer = Offer::findOrFail($id);
        $old = $offer->toArray();
        $data = $this->applyImage($request, $this->validated($request), $offer);
        $this->clearDisplaySelections($data, $offer->id);
        $offer->update($data);
        $activity->log($request, 'update', 'offers', $offer->id, $old, $offer->fresh()->toArray());

        return $this->ok($offer->fresh(), 'Offer updated successfully.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $offer = Offer::findOrFail($id);
        $old = $offer->toArray();
        $this->deleteImage($offer->image_path);
        $offer->delete();
        $activity->log($request, 'delete', 'offers', $id, $old);

        return $this->ok(null, 'Offer deleted successfully.');
    }

    private function validated(Request $request): array
    {
        $request->merge([
            'show_in_nav' => filter_var($request->input('show_in_nav'), FILTER_VALIDATE_BOOLEAN),
        ]);

        return $request->validate([
            'label' => ['nullable', 'string', 'max:255'],
            'label_bn' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'title_bn' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:1000'],
            'body_bn' => ['nullable', 'string', 'max:1000'],
            'button_label' => ['nullable', 'string', 'max:255'],
            'button_label_bn' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'url', 'max:2000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'show_in_nav' => ['nullable', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'status' => ['nullable', 'in:active,inactive'],
            'discount_type' => ['nullable', 'in:percent,fixed'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'applies_to' => ['nullable', 'in:all,category,manufacturer,products'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'manufacturer_id' => ['nullable', 'exists:manufacturers,id'],
            'product_ids' => ['nullable'],
        ]);
    }

    private function applyImage(Request $request, array $data, ?Offer $offer = null): array
    {
        unset($data['image']);

        if ($request->hasFile('image')) {
            $this->deleteImage($offer?->image_path);
            $data['image_path'] = $request->file('image')->store('offers', 'public');
            $data['image_url'] = null;
        } elseif ($request->filled('image_url') && $request->string('image_url')->toString() !== $offer?->image_url) {
            $this->deleteImage($offer?->image_path);
            $data['image_path'] = null;
        }

        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['show_in_nav'] = $request->boolean('show_in_nav');
        $data['status'] = $data['status'] ?? 'active';
        $data['discount_type'] = $data['discount_type'] ?? 'percent';
        $data['discount_value'] = $data['discount_value'] ?? 0;
        $data['applies_to'] = $data['applies_to'] ?? 'all';
        $data['product_ids'] = $this->normalizeProductIds($data['product_ids'] ?? null);

        return $data;
    }

    private function normalizeProductIds(mixed $value): ?array
    {
        if (blank($value)) {
            return null;
        }

        if (is_array($value)) {
            return collect($value)->map(fn ($id) => (int) $id)->filter()->values()->all();
        }

        return collect(explode(',', (string) $value))
            ->map(fn ($id) => (int) trim($id))
            ->filter()
            ->values()
            ->all();
    }

    private function clearDisplaySelections(array $data, ?int $exceptId = null): void
    {
        if (! empty($data['show_in_nav'])) {
            Offer::query()
                ->when($exceptId, fn ($query) => $query->whereKeyNot($exceptId))
                ->update(['show_in_nav' => false]);
        }

    }

    private function deleteImage(?string $path): void
    {
        if ($path) Storage::disk('public')->delete($path);
    }
}
