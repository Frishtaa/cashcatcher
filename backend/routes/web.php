<?php
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'Expensio API is running']);
});
