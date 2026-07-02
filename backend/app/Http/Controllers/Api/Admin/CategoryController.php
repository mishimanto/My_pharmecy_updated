<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\AdminActivityService;
use App\Services\PublicImageOptimizerService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    use ApiResponse;

    private ?bool $hasCategoryBanglaNameColumn = null;
    private ?bool $hasCategoryImageColumns = null;

    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);
        $parentColumns = $this->categoryParentSelectColumns();

        $categories = Category::query()
            ->with('parent:' . implode(',', $parentColumns))
            ->withCount(['children', 'products'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search');
                $hasBanglaColumn = $this->hasCategoryBanglaNameColumn();

                $query->where(function ($where) use ($search, $hasBanglaColumn) {
                    $where->where('category_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhereHas('parent', function ($parent) use ($search, $hasBanglaColumn) {
                            $parent->where('category_name', 'like', "%{$search}%");

                            if ($hasBanglaColumn) {
                                $parent->orWhere('category_name_bn', 'like', "%{$search}%");
                            }
                        });

                    if ($hasBanglaColumn) {
                        $where->orWhere('category_name_bn', 'like', "%{$search}%");
                    }
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('parent_id'), function ($query) use ($request) {
                $parentId = (string) $request->input('parent_id');

                $parentId === 'root'
                    ? $query->whereNull('parent_id')
                    : $query->where('parent_id', $parentId);
            })
            ->orderBy('category_name')
            ->paginate($perPage);

        return $this->ok($categories, 'Category list loaded successfully.');
    }

    public function store(Request $request, AdminActivityService $activity, PublicImageOptimizerService $images)
    {
        $rules = [
            'parent_id' => ['nullable', 'exists:categories,id'],
            'category_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];

        if ($this->hasCategoryBanglaNameColumn()) {
            $rules['category_name_bn'] = ['nullable', 'string', 'max:255'];
        }

        if ($this->hasCategoryImageColumns()) {
            $rules['image_url'] = ['nullable', 'url', 'max:2000'];
            $rules['image'] = ['nullable', 'image', 'max:5120'];
        }

        $data = $request->validate($rules);
        $data = $this->hasCategoryImageColumns()
            ? $this->applyImage($request, $data, $images)
            : $this->stripImageFields($data);

        $category = Category::create($data);
        $activity->log($request, 'create', 'category', $category->id, null, $category->toArray());

        return $this->ok(
            $category->load('parent')->loadCount(['children', 'products']),
            'Category created successfully.',
            201
        );
    }

    public function show(int $id)
    {
        return $this->ok(
            Category::with('parent', 'children')->withCount(['children', 'products'])->findOrFail($id),
            'Category details loaded successfully.'
        );
    }

    public function update(Request $request, int $id, AdminActivityService $activity, PublicImageOptimizerService $images)
    {
        $category = Category::findOrFail($id);
        $old = $category->toArray();

        $rules = [
            'parent_id' => ['nullable', 'exists:categories,id', Rule::notIn([$category->id])],
            'category_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];

        if ($this->hasCategoryBanglaNameColumn()) {
            $rules['category_name_bn'] = ['nullable', 'string', 'max:255'];
        }

        if ($this->hasCategoryImageColumns()) {
            $rules['image_url'] = ['nullable', 'url', 'max:2000'];
            $rules['image'] = ['nullable', 'image', 'max:5120'];
            $rules['remove_image'] = ['nullable', 'boolean'];
        }

        $data = $request->validate($rules);
        $data = $this->hasCategoryImageColumns()
            ? $this->applyImage($request, $data, $images, $category)
            : $this->stripImageFields($data);

        if (! empty($data['parent_id'])) {
            abort_if(
                in_array((int) $data['parent_id'], $this->descendantIds($category), true),
                422,
                'A category cannot be moved under its own child category.'
            );
        }

        $category->update($data);
        $activity->log($request, 'update', 'category', $category->id, $old, $category->fresh()->toArray());

        return $this->ok(
            $category->load('parent')->loadCount(['children', 'products']),
            'Category updated successfully.'
        );
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $category = Category::findOrFail($id);
        abort_if($category->products()->exists(), 422, 'Categories with products cannot be deleted.');

        $old = $category->toArray();
        app(PublicImageOptimizerService::class)->delete($category->image_path);
        $category->delete();
        $activity->log($request, 'delete', 'category', $id, $old);

        return $this->ok(null, 'Category deleted successfully.');
    }

    private function descendantIds(Category $category): array
    {
        return $category->children()
            ->with('children')
            ->get()
            ->flatMap(fn (Category $child) => [$child->id, ...$this->descendantIds($child)])
            ->all();
    }

    private function categoryParentSelectColumns(): array
    {
        $columns = ['id', 'category_name'];

        if ($this->hasCategoryBanglaNameColumn()) {
            $columns[] = 'category_name_bn';
        }

        return $columns;
    }

    private function hasCategoryBanglaNameColumn(): bool
    {
        return $this->hasCategoryBanglaNameColumn ??= Schema::hasColumn('categories', 'category_name_bn');
    }

    private function hasCategoryImageColumns(): bool
    {
        return $this->hasCategoryImageColumns ??= (
            Schema::hasColumn('categories', 'image_url')
            && Schema::hasColumn('categories', 'image_path')
        );
    }

    private function applyImage(Request $request, array $data, PublicImageOptimizerService $images, ?Category $category = null): array
    {
        unset($data['image'], $data['remove_image']);

        if ($request->boolean('remove_image')) {
            $images->delete($category?->image_path);
            $data['image_path'] = null;
            $data['image_url'] = null;
        }

        if ($request->hasFile('image')) {
            $data['image_path'] = $images->store($request->file('image'), 'categories', $category?->image_path, 720, 720, 82);
            $data['image_url'] = null;
        } elseif ($request->filled('image_url') && $request->string('image_url')->toString() !== $category?->getRawOriginal('image_url')) {
            $images->delete($category?->image_path);
            $data['image_path'] = null;
        }

        return $data;
    }

    private function stripImageFields(array $data): array
    {
        unset($data['image_url'], $data['image'], $data['remove_image']);

        return $data;
    }
}
