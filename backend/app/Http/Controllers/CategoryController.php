<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cats = $request->user()->categories()->orderBy('type')->orderBy('name')->get();
        return response()->json(['data' => $cats->map(fn($c) => $this->format($c))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'required|string|max:100',
            'type'  => 'required|in:income,expense',
            'color' => 'required|string|regex:/^#[0-9A-Fa-f]{3,6}$/',
            'icon'  => 'required|string|max:20',
        ]);
        $data['user_id'] = $request->user()->id;
        $cat = Category::create($data);
        return response()->json(['data' => $this->format($cat)], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $this->checkOwner($request->user(), $category);
        $data = $request->validate([
            'name'  => 'sometimes|string|max:100',
            'type'  => 'sometimes|in:income,expense',
            'color' => 'sometimes|string|regex:/^#[0-9A-Fa-f]{3,6}$/',
            'icon'  => 'sometimes|string|max:20',
        ]);
        $category->update($data);
        return response()->json(['data' => $this->format($category)]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->checkOwner($request->user(), $category);
        $category->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function checkOwner($user, Category $c): void
    {
        if ($c->user_id !== $user->id) abort(403, 'Unauthorized');
    }

    private function format(Category $c): array
    {
        return [
            'id'    => (string) $c->id,
            'name'  => $c->name,
            'type'  => $c->type,
            'color' => $c->color,
            'icon'  => $c->icon,
        ];
    }
}
