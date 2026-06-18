<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('parametres', function (Blueprint $table) {
            $table->id();
            $table->string('devise')->default('FCFA');
            $table->decimal('tva_taux', 5, 2)->default(0);
            $table->string('raison_sociale')->nullable();
            $table->string('adresse')->nullable();
            $table->string('telephone')->nullable();
            $table->timestamps();
        });

        // Ligne unique pré-remplie : GET /parametres ne doit jamais déclencher
        // une création à la volée (Laravel renverrait alors 201 au lieu de 200).
        DB::table('parametres')->insert([
            'devise' => 'FCFA',
            'tva_taux' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parametres');
    }
};
