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
