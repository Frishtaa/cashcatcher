<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->transactions()->with('category');

        if ($request->filled('type'))     $query->where('type', $request->type);
        if ($request->filled('month'))    $query->whereRaw("DATE_FORMAT(date,'%Y-%m') = ?", [$request->month]);
        if ($request->filled('category_id')) $query->where('category_id', $request->category_id);
        if ($request->filled('search'))   $query->where('description','like','%'.$request->search.'%');

        $transactions = $query->orderBy('date','desc')->orderBy('created_at','desc')->get();
        return response()->json(['data' => $transactions->map(fn($t) => $this->format($t))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'               => 'required|in:income,expense',
            'amount'             => 'required|numeric|min:0',
            'description'        => 'required|string|max:255',
            'category_id'        => 'required|exists:categories,id',
            'date'               => 'required|date_format:Y-m-d',
            'recurring'          => 'nullable|boolean',
            'recurring_interval' => 'nullable|in:daily,weekly,monthly',
        ]);

        $data['user_id'] = $request->user()->id;
        $tx = Transaction::create($data);
        $tx->load('category');

        return response()->json(['data' => $this->format($tx)], 201);
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $this->checkOwner($request->user(), $transaction);

        $data = $request->validate([
            'type'               => 'sometimes|in:income,expense',
            'amount'             => 'sometimes|numeric|min:0',
            'description'        => 'sometimes|string|max:255',
            'category_id'        => 'sometimes|exists:categories,id',
            'date'               => 'sometimes|date_format:Y-m-d',
            'recurring'          => 'nullable|boolean',
            'recurring_interval' => 'nullable|in:daily,weekly,monthly',
        ]);

        $transaction->update($data);
        $transaction->load('category');

        return response()->json(['data' => $this->format($transaction)]);
    }

    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $this->checkOwner($request->user(), $transaction);
        $transaction->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $deleted = $request->user()->transactions()->whereIn('id', $request->ids)->delete();
        return response()->json(['message' => "$deleted transactions deleted"]);
    }

    private function checkOwner($user, Transaction $t): void
    {
        if ($t->user_id !== $user->id) abort(403, 'Unauthorized');
    }

    private function format(Transaction $t): array
    {
        $date = $t->date;
        if ($date instanceof \Carbon\Carbon) $date = $date->format('Y-m-d');

        return [
            'id'                 => (string) $t->id,
            'type'               => $t->type,
            'amount'             => (float) $t->amount,
            'description'        => $t->description,
            'category_id'        => (string) $t->category_id,
            'category'           => $t->category ? [
                'id'    => (string) $t->category->id,
                'name'  => $t->category->name,
                'icon'  => $t->category->icon,
                'color' => $t->category->color,
                'type'  => $t->category->type,
            ] : null,
            'date'               => $date,
            'recurring'          => (bool) $t->recurring,
            'recurring_interval' => $t->recurring_interval,
        ];
    }
}
