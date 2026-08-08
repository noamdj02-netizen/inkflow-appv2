# North star — funnel tatoueur

Événements PostHog (`VITE_POSTHOG_KEY` + cookies analytics acceptés). Implémentation : `lib/analytics/capture.ts`.

## Événement agrégé `north_star_funnel`

Propriétés communes : `funnel: 'tattooer_growth'`, `step` (voir ci-dessous).

| `step`                        | Déclencheur                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `public_booking_url_live`     | Première sauvegarde d’un **slug** public (`SlugSettings` → `updateStudioSlug`).                                                             |
| `first_appointment_in_agenda` | **Premier** RDV ajouté depuis le dashboard (`useSupabaseDashboard.addAppointment` + écriture Supabase).                                     |
| `first_deposit_received`      | Premier acompte détecté sur au moins un RDV du studio (`DashboardPro` — même garde-fou localStorage que `tattooer_first_deposit_received`). |

## Événements existants (toujours utilisables en parallèle)

- `onboarding_funnel` — étapes onboarding classiques.
- `first_appointment_created`, `tattooer_first_deposit_received` — jalons historiques.

Dans PostHog : construire un funnel **North star** avec `north_star_funnel` filtré par `step` dans l’ordre ci-dessus, ou croiser avec les événements legacy.

## Intention produit

Mesurer : **compte créé → lien book public → au moins un RDV en agenda → premier acompte encaissé** (proxy de valeur studio).

## Alignement messaging (acquisition)

Pour que le funnel soit lisible côté studio **et** côté prospect, garder une promesse cohérente entre :

- page **pricing** / argumentaire commercial (« agenda + réservation + paiements »),
- **vitrine** `/studio/:slug` et tunnel **`/book/:slug`** (ce que le client voit),
- **premier mail** après inscription (time-to-value : slug + premier RDV).

En cas de test A/B sur la landing, reporter la variante dans les événements analytics ou en note interne pour ne pas mélanger les cohortes dans PostHog.
