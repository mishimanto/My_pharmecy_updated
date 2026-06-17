<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $categories = Category::query()
            ->with('parent:id,category_name')
            ->withCount(['children', 'products'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search');

                $query->where(function ($where) use ($search) {
                    $where->where('category_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhereHas('parent', fn ($parent) => $parent->where('category_name', 'like', "%{$search}%"));
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

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $request->validate([
            'parent_id' => ['nullable', 'exists:categories,id'],
            'category_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

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

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $category = Category::findOrFail($id);
        $old = $category->toArray();

        $data = $request->validate([
            'parent_id' => ['nullable', 'exists:categories,id', Rule::notIn([$category->id])],
            'category_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

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
}
