/**
 * Navigation SPA depuis l’app client (même mécanisme que PublicStudioPagePro).
 */
export function clientNavigate(path: string): void {
  const target = path.startsWith('/') ? path : `/${path}`;
  window.history.pushState({}, '', target);
  window.dispatchEvent(new CustomEvent('inkflow-navigate'));
}
