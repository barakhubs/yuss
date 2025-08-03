<?php

namespace App\Models\Sacco;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Committee extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'type',
        'status',
        'chairman_id',
        'secretary_id',
    ];

    protected $casts = [
        'status' => 'string',
        'type' => 'string',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function chairman(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chairman_id');
    }

    public function secretary(): BelongsTo
    {
        return $this->belongsTo(User::class, 'secretary_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(CommitteeMember::class);
    }

    public function getMembersCountAttribute()
    {
        return $this->members()->count();
    }
}
