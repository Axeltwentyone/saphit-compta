<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Produit;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RapportController extends Controller
{
    public function creances(Request $request, string $format)
    {
        $this->validerFormat($format);

        $factures = Facture::with(['client', 'paiements', 'avoirs'])
            ->where('type', 'facture')
            ->whereIn('statut', ['emise', 'partiellement_reglee'])
            ->get()
            ->filter(fn ($f) => $f->solde_restant > 0)
            ->map(fn ($f) => [
                'numero' => $f->numero,
                'client' => $f->client->nom,
                'echeance' => $f->date_echeance?->format('Y-m-d'),
                'total_ttc' => (float) $f->total_ttc,
                'solde_restant' => $f->solde_restant,
            ])
            ->values();

        if ($format === 'pdf') {
            return Pdf::loadView('rapports.creances', ['titre' => 'Relevé des créances clients', 'factures' => $factures])
                ->download('creances.pdf');
        }

        return $this->csv(
            ['Facture', 'Client', 'Échéance', 'Total TTC', 'Reste dû'],
            $factures->map(fn ($f) => [$f['numero'], $f['client'], $f['echeance'], $f['total_ttc'], $f['solde_restant']]),
            'creances.csv',
        );
    }

    public function stock(Request $request, string $format)
    {
        $this->validerFormat($format);

        $produits = Produit::where('actif', true)
            ->orderBy('designation')
            ->get()
            ->map(fn ($p) => [
                'code' => $p->code,
                'designation' => $p->designation,
                'categorie' => $p->categorie,
                'quantite_stock' => (float) $p->quantite_stock,
                'seuil_alerte' => (float) $p->seuil_alerte,
                'valeur' => (float) $p->quantite_stock * (float) $p->prix_vente,
            ]);

        if ($format === 'pdf') {
            return Pdf::loadView('rapports.stock', ['titre' => 'État du stock', 'produits' => $produits])
                ->download('stock.pdf');
        }

        return $this->csv(
            ['Code', 'Désignation', 'Catégorie', 'Stock', 'Seuil', 'Valeur du stock'],
            $produits->map(fn ($p) => [$p['code'], $p['designation'], $p['categorie'], $p['quantite_stock'], $p['seuil_alerte'], $p['valeur']]),
            'stock.csv',
        );
    }

    public function journalVentes(Request $request, string $format)
    {
        $this->validerFormat($format);

        $date = $request->input('date', now()->toDateString());

        $factures = Facture::with(['client', 'commercial'])
            ->where('type', 'facture')
            ->whereDate('date', $date)
            ->get()
            ->map(fn ($f) => [
                'numero' => $f->numero,
                'client' => $f->client->nom,
                'commercial' => $f->commercial?->name,
                'total_ttc' => (float) $f->total_ttc,
                'statut' => $f->statut,
            ]);

        if ($format === 'pdf') {
            return Pdf::loadView('rapports.journal-ventes', ['titre' => "Journal des ventes du {$date}", 'factures' => $factures])
                ->download("journal-ventes-{$date}.pdf");
        }

        return $this->csv(
            ['Facture', 'Client', 'Commercial', 'Total TTC', 'Statut'],
            $factures->map(fn ($f) => [$f['numero'], $f['client'], $f['commercial'], $f['total_ttc'], $f['statut']]),
            "journal-ventes-{$date}.csv",
        );
    }

    private function validerFormat(string $format): void
    {
        abort_unless(in_array($format, ['csv', 'pdf'], true), 404);
    }

    private function csv(array $entetes, Collection $lignes, string $nomFichier): StreamedResponse
    {
        return response()->streamDownload(function () use ($entetes, $lignes) {
            $sortie = fopen('php://output', 'w');
            fputcsv($sortie, $entetes);
            foreach ($lignes as $ligne) {
                fputcsv($sortie, $ligne);
            }
            fclose($sortie);
        }, $nomFichier, ['Content-Type' => 'text/csv']);
    }
}
