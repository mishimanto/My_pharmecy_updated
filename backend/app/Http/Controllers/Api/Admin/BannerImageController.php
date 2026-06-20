<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BannerImage;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BannerImageController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = BannerImage::query()->orderBy('sort_order')->orderBy('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('placement')) {
            $query->where('placement', $request->string('placement')->toString());
        }

        return $this->ok($query->get(), 'Banner images loaded successfully.');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $this->applyImage($request, $this->validated($request));
        $banner = BannerImage::create($data);
        $activity->log($request, 'create', 'banner_images', $banner->id, null, $banner->toArray());

        return $this->ok($banner->fresh(), 'Banner image created successfully.', 201);
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $banner = BannerImage::findOrFail($id);
        $old = $banner->toArray();
        $data = $this->applyImage($request, $this->validated($request), $banner);

        $banner->update($data);
        $activity->log($request, 'update', 'banner_images', $banner->id, $old, $banner->fresh()->toArray());

        return $this->ok($banner->fresh(), 'Banner image updated successfully.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $banner = BannerImage::findOrFail($id);
        $old = $banner->toArray();
        $this->deleteImage($banner->image_path);
        $banner->delete();
        $activity->log($request, 'delete', 'banner_images', $id, $old);

        return $this->ok(null, 'Banner image deleted successfully.');
    }

    private function validated(Request $request): array
    {
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
            'placement' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'url', 'max:2000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);
    }

    private function applyImage(Request $request, array $data, ?BannerImage $banner = null): array
    {
        unset($data['image']);

        if ($request->hasFile('image')) {
            $this->deleteImage($banner?->image_path);
            $data['image_path'] = $request->file('image')->store('banner-images', 'public');
            $data['image_url'] = null;
        } elseif ($request->filled('image_url') && $request->string('image_url')->toString() !== $banner?->image_url) {
            $this->deleteImage($banner?->image_path);
            $data['image_path'] = null;
        }

        $data['placement'] = $data['placement'] ?: 'homepage';
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['status'] = $data['status'] ?? 'active';

        return $data;
    }

    private function deleteImage(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
