# Démo — Lien de paiement acompte (Stripe)

Le flux **« Demander un acompte »** est déjà intégré dans le Dashboard. Voici où le trouver et comment il fonctionne.

---

## Où est le bouton ?

**Dashboard → onglet « Demandes »** (`RequestsDashboard.tsx`).

Le bouton **« Demander un acompte »** ou **« Générer un lien d'acompte »** apparaît à trois endroits :

| Onglet | Contexte | Libellé du bouton |
|--------|----------|-------------------|
| **RDV** | Chaque RDV en attente | « Générer un lien d'acompte » |
| **RDV vitrine** | Chaque demande venue du formulaire vitrine (statut En attente) | « Demander un acompte » |
| **Historique** | RDV confirmés dont l'acompte n'est pas encore payé | « Générer un lien d'acompte » |

**Condition d’affichage :** le `studioId` doit être défini (connexion Supabase + `ensureStudio` OK). Pour l’onglet **RDV vitrine**, `onAddAppointment` doit aussi être fourni (c’est le cas quand le dashboard utilise les données Supabase).

---

## Flux au clic

1. **Clic** sur « Demander un acompte » ou « Générer un lien d'acompte »  
   → Ouverture d’une **modale**.

2. **Modale : montant**  
   - Saisie du montant en € (ex. 50).  
   - Bouton : **« Générer le lien de paiement »** (ou « Créer le RDV et générer le lien » depuis une demande vitrine).

3. **Chargement**  
   - Le bouton affiche un **spinner** et le texte **« Génération du lien… »**.  
   - Appel de l’Edge Function `create-checkout-session` avec : `studioId`, `appointmentId` (ou RDV créé depuis la demande), `amount`, `clientName`, `clientEmail`, `serviceName`, `type: 'deposit'`.

4. **Résultat**  
   - L’URL Stripe est affichée dans un champ en lecture seule.  
   - Bouton **« Copier le lien »** : copie dans le presse-papier pour envoi au client (DM, mail).  
   - **Aucune redirection** du tatoueur vers Stripe.

5. **Fermeture**  
   - « Fermer » pour fermer la modale.

---

## Fichiers concernés

- **UI :** `components/dashboard/RequestsDashboard.tsx`  
  - États : `depositModalAppointment`, `depositModalBooking`, `depositAmount`, `depositLoading`, `depositUrl`.  
  - Handlers : `openDepositModal`, `openDepositModalForBooking`, `closeDepositModal`, `handleGenerateDepositLink`, `handleCopyDepositLink`.  
  - Modale : `Modal` en bas du composant (montant → lien → copier).

- **Client Stripe :** `lib/stripeClient.ts`  
  - `createCheckoutSession(params)` → appelle `supabase.functions.invoke('create-checkout-session', { body: params })` et retourne `data.url`.

- **Backend :** `supabase/functions/create-checkout-session/index.ts`  
  - Crée la session Stripe, enregistre dans `inkflow_payments`, retourne `{ url, sessionId }`.

- **Webhook :** `supabase/functions/stripe-webhook/index.ts`  
  - Met à jour le RDV (ex. `deposit_paid`) après paiement réussi.

---

## Si le bouton n’apparaît pas

1. Vérifier que **Supabase** est configuré : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local`.  
2. Vérifier qu’il y a bien des **demandes** (RDV en attente, RDV vitrine en attente, ou RDV confirmés sans acompte dans l’historique).  
3. Pour l’onglet **RDV vitrine** : le dashboard doit recevoir `onAddAppointment` (fourni par `DashboardPro` avec `addAppointment`).
