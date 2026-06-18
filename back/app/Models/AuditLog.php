<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'action', 'description'])]
class AuditLog extends Model
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')->withTrashed();
    }

    public static function enregistrer(int $userId, string $action, string $description): void
    {
        static::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
        ]);
    }
}
