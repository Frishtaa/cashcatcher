<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BudgetController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);

// Protected
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',    [AuthController::class, 'logout']);
    Route::get('/me',         [AuthController::class, 'me']);

    Route::get('/transactions',                     [TransactionController::class, 'index']);
    Route::post('/transactions',                    [TransactionController::class, 'store']);
    Route::patch('/transactions/{transaction}',     [TransactionController::class, 'update']);
    Route::delete('/transactions/{transaction}',    [TransactionController::class, 'destroy']);
    Route::delete('/transactions',                  [TransactionController::class, 'bulkDestroy']);

    Route::get('/categories',                    [CategoryController::class, 'index']);
    Route::post('/categories',                   [CategoryController::class, 'store']);
    Route::patch('/categories/{category}',       [CategoryController::class, 'update']);
    Route::delete('/categories/{category}',      [CategoryController::class, 'destroy']);

    Route::get('/budgets',               [BudgetController::class, 'index']);
    Route::post('/budgets',              [BudgetController::class, 'upsert']);
    Route::delete('/budgets/{budget}',   [BudgetController::class, 'destroy']);
});