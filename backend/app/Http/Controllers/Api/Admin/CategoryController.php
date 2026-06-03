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
        $categories = Category::query()
            ->with('parent:id,category_name')
            ->when($request->search, fn ($query, $search) => $query->where('category_name', 'like', "%{$search}%")->orWhere('status', 'like', "%{$search}%"))
            ->latest('id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($categories, 'ক্যাটাগরি তালিকা পাওয়া গেছে।');
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

        return $this->ok($category->load('parent'), 'ক্যাটাগরি তৈরি হয়েছে।', 201);
    }

    public function show(int $id)
    {
        return $this->ok(Category::with('parent', 'children')->findOrFail($id), 'ক্যাটাগরি তথ্য পাওয়া গেছে।');
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $category = Category::findOrFail($id);
        $old = $category->toArray();
        $data = $request->validate([
            'parent_id' => ['nullable', 'exists:categories,id'],
            'category_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $category->update($data);
        $activity->log($request, 'update', 'category', $category->id, $old, $category->fresh()->toArray());

        return $this->ok($category->load('parent'), 'ক্যাটাগরি আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $category = Category::findOrFail($id);
        abort_if($category->products()->exists(), 422, 'প্রোডাক্ট থাকা ক্যাটাগরি ডিলিট করা যাবে না।');
        $old = $category->toArray();
        $category->delete();
        $activity->log($request, 'delete', 'category', $id, $old);

        return $this->ok(null, 'ক্যাটাগরি ডিলিট হয়েছে।');
    }
}

