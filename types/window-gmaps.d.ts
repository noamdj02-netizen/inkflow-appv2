/** Callback global Google Maps JS API (auth / chargement). */
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export {};
