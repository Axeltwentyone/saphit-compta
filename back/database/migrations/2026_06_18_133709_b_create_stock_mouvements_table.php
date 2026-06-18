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
        Schema::create('stock_mouvements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produit_id')->constrained();
            $table->enum('type', ['entree', 'sortie', 'correction']);
            $table->decimal('quantite', 12, 2);
            $table->text('motif')->nullable();
            $table->foreignId('facture_id')->nullable()->constrained();
            $table->foreignId('user_id')->constrained();
            $table->date('date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_mouvements');
    }
};
