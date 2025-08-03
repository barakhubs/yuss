<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberSavingsTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'quarter_id',
        'monthly_target',
    ];

    protected $casts = [
        'monthly_target' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quarter(): BelongsTo
    {
        return $this->belongsTo(Quarter::class);
    }
}
