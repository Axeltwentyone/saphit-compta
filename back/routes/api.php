<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\ParametreController;
use App\Http\Controllers\Api\ProduitController;
use App\Http\Controllers\Api\PropositionController;
use App\Http\Controllers\Api\RapportController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/parametres', [ParametreController::class, 'show']);

    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients', [ClientController::class, 'store']);

    Route::get('/produits', [ProduitController::class, 'index']);

    Route::get('/propositions', [PropositionController::class, 'index']);
    Route::post('/propositions', [PropositionController::class, 'store']);
    Route::get('/propositions/{proposition}', [PropositionController::class, 'show']);
    Route::put('/propositions/{proposition}', [PropositionController::class, 'update']);
    Route::post('/propositions/{proposition}/submit', [PropositionController::class, 'submit']);
    Route::delete('/propositions/{proposition}', [PropositionController::class, 'destroy']);

    Route::middleware('role:comptable,dg')->group(function () {
        Route::post('/propositions/{proposition}/convertir', [PropositionController::class, 'convertir']);

        Route::get('/factures', [FactureController::class, 'index']);
        Route::post('/factures', [FactureController::class, 'store']);
        Route::get('/factures/{facture}', [FactureController::class, 'show']);
        Route::put('/factures/{facture}', [FactureController::class, 'update']);
        Route::post('/factures/{facture}/emettre', [FactureController::class, 'emettre']);
        Route::post('/factures/{facture}/annuler', [FactureController::class, 'annuler']);
        Route::post('/factures/{facture}/avoir', [FactureController::class, 'avoir']);

        Route::get('/paiements', [PaiementController::class, 'index']);
        Route::post('/paiements', [PaiementController::class, 'store']);
        Route::patch('/paiements/{paiement}/affecter', [PaiementController::class, 'affecter']);

        Route::post('/produits', [ProduitController::class, 'store']);
        Route::get('/produits/{produit}', [ProduitController::class, 'show']);
        Route::put('/produits/{produit}', [ProduitController::class, 'update']);
        Route::post('/produits/{produit}/entree', [ProduitController::class, 'entree']);
        Route::post('/produits/{produit}/correction', [ProduitController::class, 'correction']);

        Route::get('/rapports/creances/{format}', [RapportController::class, 'creances']);
        Route::get('/rapports/stock/{format}', [RapportController::class, 'stock']);
        Route::get('/rapports/journal-ventes/{format}', [RapportController::class, 'journalVentes']);
    });

    Route::middleware('role:dg')->group(function () {
        Route::put('/parametres', [ParametreController::class, 'update']);

        Route::get('/utilisateurs', [UserController::class, 'index']);
        Route::post('/utilisateurs', [UserController::class, 'store']);
        Route::put('/utilisateurs/{user}', [UserController::class, 'update']);
        Route::delete('/utilisateurs/{user}', [UserController::class, 'destroy']);

        Route::get('/audit', [AuditLogController::class, 'index']);
    });
});
