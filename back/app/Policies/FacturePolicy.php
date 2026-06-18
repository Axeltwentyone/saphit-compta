<?php

namespace App\Policies;

use App\Models\Facture;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class FacturePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Facture $facture): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update or annuler the model.
     */
    public function update(User $user, Facture $facture): bool
    {
        if ($user->isDg()) {
            return true;
        }

        return $facture->paiements()->count() === 0
            && in_array($facture->statut, ['brouillon', 'emise'], true);
    }

    /**
     * Determine whether the user can cancel the model.
     */
    public function annuler(User $user, Facture $facture): bool
    {
        return $this->update($user, $facture);
    }

    /**
     * Determine whether the user can émettre (brouillon → emise) the model.
     *
     * Contrairement à update()/annuler(), un acompte déjà enregistré à la
     * création (paiement sur une facture encore brouillon) ne doit pas
     * bloquer son émission : les montants ne changent pas, seul le statut
     * passe à "emise".
     */
    public function emettre(User $user, Facture $facture): bool
    {
        return $user->isDg() || $facture->statut === 'brouillon';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Facture $facture): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Facture $facture): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Facture $facture): bool
    {
        return false;
    }
}
