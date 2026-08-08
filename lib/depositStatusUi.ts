/** Statuts acompte affichés (tableau pilotage + tuiles bento). */
export type DepositUiStatus = 'Payé' | 'En attente' | 'Relance' | 'Échoué' | 'Remboursé';

export function depositStatusDotClass(status: DepositUiStatus): string {
  switch (status) {
    case 'Payé':
      return 'bg-emerald-500';
    case 'En attente':
      return 'bg-amber-500';
    case 'Relance':
      return 'bg-muted-foreground/64';
    case 'Échoué':
    case 'Remboursé':
      return 'bg-red-500';
    default:
      return 'bg-muted-foreground/64';
  }
}

/** Ligne acompte Stripe (mapper bento). */
export function stripeDepositRowUiStatus(
  status: 'réussi' | 'en_cours' | 'remboursé'
): DepositUiStatus {
  if (status === 'réussi') return 'Payé';
  if (status === 'remboursé') return 'Remboursé';
  if (status === 'en_cours') return 'En attente';
  return 'En attente';
}
