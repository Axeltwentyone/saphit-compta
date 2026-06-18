<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('proposition_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposition_id')->constrained()->cascadeOnDelete();
            $table->string('designation');
            $table->decimal('quantite', 12, 2);
            $table->decimal('prix_unitaire', 14, 2);
            $table->decimal('remise_pourcentage', 5, 2)->default(0);
            $table->decimal('total_ligne', 14, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposition_lignes');
    }
};
