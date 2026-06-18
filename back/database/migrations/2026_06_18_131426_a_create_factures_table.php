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
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->enum('type', ['facture', 'avoir'])->default('facture');
            $table->foreignId('origine_facture_id')->nullable()->constrained('factures');
            $table->foreignId('proposition_id')->nullable()->constrained();
            $table->foreignId('client_id')->constrained();
            $table->foreignId('commercial_id')->nullable()->constrained('users');
            $table->date('date');
            $table->date('date_echeance')->nullable();
            $table->enum('statut', ['brouillon', 'emise', 'partiellement_reglee', 'soldee', 'annulee'])->default('brouillon');
            $table->decimal('total_ht', 14, 2)->default(0);
            $table->decimal('total_tva', 14, 2)->default(0);
            $table->decimal('total_ttc', 14, 2)->default(0);
            $table->text('remarque')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
