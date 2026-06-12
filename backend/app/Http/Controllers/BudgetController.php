<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->budgets();
        if ($request->filled('month')) $query->where('month', $request->month);
        $budgets = $query->get();
        return response()->json(['data' => $budgets->map(fn($b) => $this->format($b))]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount'      => 'required|numeric|min:0',
            'month'       => 'required|date_format:Y-m',
        ]);

        $budget = Budget::updateOrCreate(
            ['user_id' => $request->user()->id, 'category_id' => $data['category_id'], 'month' => $data['month']],
            ['amount'  => $data['amount']]
        );

        return response()->json(['data' => $this->format($budget)]);
    }

    public function destroy(Request $request, Budget $budget): JsonResponse
    {
        if ($budget->user_id !== $request->user()->id) abort(403, 'Unauthorized');
        $budget->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function format(Budget $b): array
    {
        return [
            'id'          => (string) $b->id,
            'category_id' => (string) $b->category_id,
            'amount'      => (float)  $b->amount,
            'month'       => $b->month,
        ];
    }
}
