<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketingPopup;
use App\Models\Offer;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MarketingPopupController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->ok(
            MarketingPopup::query()->with('sourceOffer:id,title')->latest()->get(),
            'Popups loaded successfully.'
        );
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $this->applyImage($request, $this->applySourceOffer($this->validated($request)));
        $this->clearActivePopup($data);
        $popup = MarketingPopup::create($data);
        $activity->log($request, 'create', 'marketing_popups', $popup->id, null, $popup->toArray());

        return $this->ok($popup->fresh('sourceOffer:id,title'), 'Popup created successfully.', 201);
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $popup = MarketingPopup::findOrFail($id);
        $old = $popup->toArray();
        $data = $this->applyImage($request, $this->applySourceOffer($this->validated($request)), $popup);
        $this->clearActivePopup($data, $popup->id);
        $popup->update($data);
        $activity->log($request, 'update', 'marketing_popups', $popup->id, $old, $popup->fresh()->toArray());

        return $this->ok($popup->fresh('sourceOffer:id,title'), 'Popup updated successfully.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $popup = MarketingPopup::findOrFail($id);
        $old = $popup->toArray();
        $this->deleteImage($popup->image_path);
        $popup->delete();
        $activity->log($request, 'delete', 'marketing_popups', $id, $old);

        return $this->ok(null, 'Popup deleted successfully.');
    }

    private function validated(Request $request): array
    {
        $request->merge([
            'is_active' => filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN),
        ]);

        return $request->validate([
            'source_offer_id' => ['nullable', 'exists:offers,id'],
            'label' => ['nullable', 'string', 'max:255'],
            'label_bn' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'title_bn' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:1000'],
            'body_bn' => ['nullable', 'string', 'max:1000'],
            'button_label' => ['nullable', 'string', 'max:255'],
            'button_label_bn' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'url', 'max:2000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    private function applySourceOffer(array $data): array
    {
        if (empty($data['source_offer_id'])) {
            abort_if(empty($data['title']), 422, 'Popup title is required.');

            return $data;
        }

        $offer = Offer::findOrFail($data['source_offer_id']);

        foreach (['label', 'label_bn', 'title', 'title_bn', 'body', 'body_bn', 'button_label', 'button_label_bn', 'link_url', 'image_url', 'starts_at', 'ends_at'] as $field) {
            if (! array_key_exists($field, $data) || $data[$field] === null || $data[$field] === '') {
                $data[$field] = $offer->{$field};
            }
        }

        abort_if(empty($data['title']), 422, 'Popup title is required.');

        return $data;
    }

    private function applyImage(Request $request, array $data, ?MarketingPopup $popup = null): array
    {
        unset($data['image']);

        if ($request->hasFile('image')) {
            $this->deleteImage($popup?->image_path);
            $data['image_path'] = $request->file('image')->store('marketing-popups', 'public');
            $data['image_url'] = null;
        } elseif ($request->filled('image_url') && $request->string('image_url')->toString() !== $popup?->image_url) {
            $this->deleteImage($popup?->image_path);
            $data['image_path'] = null;
        }

        $data['is_active'] = (bool) ($data['is_active'] ?? false);

        return $data;
    }

    private function clearActivePopup(array $data, ?int $exceptId = null): void
    {
        if (empty($data['is_active'])) {
            return;
        }

        MarketingPopup::query()
            ->when($exceptId, fn ($query) => $query->whereKeyNot($exceptId))
            ->update(['is_active' => false]);
    }

    private function deleteImage(?string $path): void
    {
        if ($path) Storage::disk('public')->delete($path);
    }
}
