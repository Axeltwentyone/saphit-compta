<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return User::orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:commercial,comptable,dg'],
        ]);

        $user = User::create($data);

        AuditLog::enregistrer(
            $request->user()->id,
            'utilisateur.creer',
            "Utilisateur {$user->name} ({$user->email}) créé avec le rôle {$user->role}.",
        );

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', "unique:users,email,{$user->id}"],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'in:commercial,comptable,dg'],
            'actif' => ['required', 'boolean'],
        ]);

        $roleAvant = $user->role;
        $actifAvant = $user->actif;

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'actif' => $data['actif'],
        ]);

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->save();

        if ($roleAvant !== $user->role || $actifAvant !== $user->actif) {
            AuditLog::enregistrer(
                $request->user()->id,
                'utilisateur.modifier',
                "Utilisateur {$user->name} : rôle {$roleAvant}→{$user->role}, actif ".
                    ($actifAvant ? 'oui' : 'non').'→'.($user->actif ? 'oui' : 'non').'.',
            );
        }

        return $user;
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($user->id === $request->user()->id, 422, 'Vous ne pouvez pas supprimer votre propre compte.');

        $nom = $user->name;
        $email = $user->email;
        $user->delete();

        AuditLog::enregistrer(
            $request->user()->id,
            'utilisateur.supprimer',
            "Utilisateur {$nom} ({$email}) supprimé.",
        );

        return response()->json(null, 204);
    }
}
