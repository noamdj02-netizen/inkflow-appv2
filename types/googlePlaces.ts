/** Avis renvoyé par l’Edge Function (données Places API filtrées, sans clé). */
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
