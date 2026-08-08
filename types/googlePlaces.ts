/** Avis renvoyé par l’Edge Function `google-places` (Places API côté serveur uniquement ; pas de clé côté navigateur). */
export interface GooglePlaceReviewDTO {
  authorName: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
}

export interface GoogleReviewsPayload {
  rating: number | null;
  userRatingsTotal: number;
  reviews: GooglePlaceReviewDTO[];
}

export interface GooglePlaceSearchResultDTO {
  placeId: string;
  name: string;
  formattedAddress: string;
}

/** Avis renvoyé par l'API Google Business Profile (tous les avis, pas seulement les 5 derniers). */
export interface GoogleBusinessReview {
  authorName: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  createTime?: string;
}

export interface GoogleBusinessReviewsPayload {
  reviews: GoogleBusinessReview[];
  averageRating: number | null;
  totalReviewCount: number;
}

export interface GoogleBusinessStatus {
  connected: boolean;
  locationName: string | null;
  needsLocationSelection: boolean;
}

/** Fiche Google Business (location) renvoyée par l’Edge Function `google-business-auth`. */
export interface GoogleBusinessLocationRow {
  name: string;
  title: string;
  accountName: string;
}

/** Résultat de `action: locations` — liste + métadonnées pour l’UI (état vide, erreurs API). */
export interface GoogleBusinessLocationsResult {
  locations: GoogleBusinessLocationRow[];
  /** Erreurs par compte lors de l’appel Locations API (ex. 403, scope). */
  fetchErrors?: string[];
  accountsCount?: number;
  cached?: boolean;
  /** Quota Google Account Management (~1 req/min) : réponse depuis le cache ou attente. */
  rateLimited?: boolean;
  /** Message affiché quand `rateLimited` (évite un échec silencieux). */
  warning?: string;
}
