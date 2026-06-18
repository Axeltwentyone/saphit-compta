<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Parametre;
use Illuminate\Http\Request;

class ParametreController extends Controller
{
    public function show()
    {
        return Parametre::actuel();
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'devise' => ['required', 'string', 'max:10'],
            'tva_taux' => ['required', 'numeric', 'min:0', 'max:100'],
            'raison_sociale' => ['nullable', 'string', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
        ]);

        $parametre = Parametre::actuel();
        $parametre->update($data);

        AuditLog::enregistrer(
            $request->user()->id,
            'parametres.modifier',
            "Paramètres mis à jour : devise={$data['devise']}, tva={$data['tva_taux']}%",
        );

        return $parametre;
    }
}
