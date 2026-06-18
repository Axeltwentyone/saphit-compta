@extends('rapports.layout')

@section('contenu')
<table>
    <thead>
        <tr>
            <th>Facture</th>
            <th>Client</th>
            <th>Échéance</th>
            <th class="montant">Total TTC</th>
            <th class="montant">Reste dû</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($factures as $f)
        <tr>
            <td>{{ $f['numero'] }}</td>
            <td>{{ $f['client'] }}</td>
            <td>{{ $f['echeance'] ?? '—' }}</td>
            <td class="montant">{{ number_format($f['total_ttc'], 2, ',', ' ') }}</td>
            <td class="montant">{{ number_format($f['solde_restant'], 2, ',', ' ') }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endsection
