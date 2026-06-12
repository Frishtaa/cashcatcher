<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = ['user_id','type','amount','description','category_id','date','recurring','recurring_interval'];
    protected $casts    = ['amount'=>'float','recurring'=>'boolean','date'=>'date'];

    public function user()     { return $this->belongsTo(User::class); }
    public function category() { return $this->belongsTo(Category::class); }
}
