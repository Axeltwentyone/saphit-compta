@extends('rapports.layout')

@section('contenu')
<table>
    <thead>
        <tr>
            <th>Code</th>
            <th>Désignation</th>
            <th>Catégorie</th>
            <th class="montant">Stock</th>
            <th class="montant">Seuil</th>
            <th class="montant">Valeur du stock</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($produits as $p)
        <tr>
            <td>{{ $p['code'] }}</td>
            <td>{{ $p['designation'] }}</td>
            <td>{{ $p['categorie'] ?? '—' }}</td>
            <td class="montant">{{ number_format($p['quantite_stock'], 2, ',', ' ') }}</td>
            <td class="montant">{{ number_format($p['seuil_alerte'], 2, ',', ' ') }}</td>
            <td class="montant">{{ number_format($p['valeur'], 2, ',', ' ') }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endsection
