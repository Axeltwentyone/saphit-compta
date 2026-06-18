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
        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->foreignId('produit_id')->nullable()->after('facture_id')->constrained();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('produit_id');
        });
    }
};
