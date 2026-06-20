<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HeroSlideController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = HeroSlide::query()->orderBy('sort_order')->orderBy('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return $this->ok($query->get(), 'Hero slides loaded successfully.');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $this->validated($request);
        $data = $this->applyImage($request, $data);

        $slide = HeroSlide::create($data);
        $activity->log($request, 'create', 'hero_slides', $slide->id, null, $slide->toArray());

        return $this->ok($slide->fresh(), 'Hero slide created successfully.', 201);
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $slide = HeroSlide::findOrFail($id);
        $old = $slide->toArray();
        $data = $this->validated($request);
        $data = $this->applyImage($request, $data, $slide);

        $slide->update($data);
        $activity->log($request, 'update', 'hero_slides', $slide->id, $old, $slide->fresh()->toArray());

        return $this->ok($slide->fresh(), 'Hero slide updated successfully.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $slide = HeroSlide::findOrFail($id);
        $old = $slide->toArray();
        $this->deleteImage($slide->image_path);
        $slide->delete();
        $activity->log($request, 'delete', 'hero_slides', $id, $old);

        return $this->ok(null, 'Hero slide deleted successfully.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'eyebrow' => ['nullable', 'string', 'max:255'],
            'eyebrow_bn' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'title_bn' => ['nullable', 'string', 'max:255'],
            'primary_label' => ['nullable', 'string', 'max:255'],
            'primary_label_bn' => ['nullable', 'string', 'max:255'],
            'primary_url' => ['nullable', 'string', 'max:255'],
            'secondary_label' => ['nullable', 'string', 'max:255'],
            'secondary_label_bn' => ['nullable', 'string', 'max:255'],
            'secondary_url' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'url', 'max:2000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'remove_image' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);
    }

    private function applyImage(Request $request, array $data, ?HeroSlide $slide = null): array
    {
        unset($data['image'], $data['remove_image']);

        if ($request->boolean('remove_image')) {
            $this->deleteImage($slide?->image_path);
            $data['image_path'] = null;
            $data['image_url'] = null;
        }

        if ($request->hasFile('image')) {
            $this->deleteImage($slide?->image_path);
            $data['image_path'] = $request->file('image')->store('hero-slides', 'public');
            $data['image_url'] = null;
        } elseif ($request->filled('image_url') && $request->string('image_url')->toString() !== $slide?->image_url) {
            $this->deleteImage($slide?->image_path);
            $data['image_path'] = null;
        }

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
