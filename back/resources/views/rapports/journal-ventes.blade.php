@extends('rapports.layout')

@section('contenu')
<table>
    <thead>
        <tr>
            <th>Facture</th>
            <th>Client</th>
            <th>Commercial</th>
            <th class="montant">Total TTC</th>
            <th>Statut</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($factures as $f)
        <tr>
            <td>{{ $f['numero'] }}</td>
            <td>{{ $f['client'] }}</td>
            <td>{{ $f['commercial'] ?? '—' }}</td>
            <td class="montant">{{ number_format($f['total_ttc'], 2, ',', ' ') }}</td>
            <td>{{ $f['statut'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endsection
