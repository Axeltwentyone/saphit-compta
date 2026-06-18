<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1e293b; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p.sous-titre { color: #64748b; margin-top: 0; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; }
        td.montant, th.montant { text-align: right; }
    </style>
</head>
<body>
    <h1>{{ $titre }}</h1>
    <p class="sous-titre">Généré le {{ now()->format('d/m/Y H:i') }}</p>
    @yield('contenu')
</body>
</html>
