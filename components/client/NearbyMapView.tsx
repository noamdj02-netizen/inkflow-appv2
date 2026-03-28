/**
 * NearbyMapView — Carte Google Maps des studios proches
 *
 * Charge l'API Google Maps de façon dynamique (pas de package npm supplémentaire).
 * Affiche :
 *  - Point bleu = position de l'utilisateur
 *  - Pins neon #DFFF00 = studios proches (click → callback onSelectStudio)
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import type { NearbyStudio } from '../../lib/supabaseGeo';

interface NearbyMapViewProps {
  userPos: { lat: number; lng: number };
  studios: NearbyStudio[];
  onSelectStudio: (studio: NearbyStudio) => void;
}

declare global {
  interface Window {
    _inkflowMapInit?: () => void;
    google?: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => GoogleMapInstance;
        Marker: new (opts: object) => { addListener: (e: string, cb: () => void) => void };
        Circle: new (opts: object) => void;
        LatLng: new (lat: number, lng: number) => object;
        Animation: { DROP: number };
        SymbolPath: { CIRCLE: number };
      };
    };
  }
}

interface GoogleMapInstance {
  setCenter: (latlng: object) => void;
}

const N = {
  bg: '#0A0A0A', surface: '#111111', border: '#202020',
  neon: '#DFFF00', text: '#F5F3EF', muted: '#555555',
};

export const NearbyMapView: React.FC<NearbyMapViewProps> = ({
  userPos, studios, onSelectStudio,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMapInstance | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Charge le script Google Maps une seule fois
  useEffect(() => {
    if (window.google?.maps) { setApiReady(true); return; }

    const apiKey = (import.meta as { env: Record<string, string> }).env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) { setApiError(true); return; }

    const callbackName = '_inkflowMapInit';
    window[callbackName] = () => setApiReady(true);

    if (document.querySelector(`script[data-inkflow-maps]`)) return;

    const script = document.createElement('script');
    script.dataset.inkflowMaps = '1';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => setApiError(true);
    document.head.appendChild(script);

    return () => { delete window[callbackName]; };
  }, []);

  // Initialise la carte une fois l'API prête
  useEffect(() => {
    if (!apiReady || !mapRef.current || !window.google?.maps) return;

    const gmaps = window.google.maps;

    const map = new gmaps.Map(mapRef.current, {
      center: userPos,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#848484' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0A0A' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111111' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111e2a' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
      ],
    });

    mapInstanceRef.current = map;

    // Point utilisateur (cercle bleu)
    new gmaps.Marker({
      position: userPos,
      map,
      title: 'Vous',
      icon: {
        path: gmaps.SymbolPath.CIRCLE,
        fillColor: '#4A9EFF',
        fillOpacity: 1,
        scale: 8,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: 100,
    });

    // Rayon de recherche
    new gmaps.Circle({
      center: userPos,
      radius: 5000,
      map,
      fillColor: N.neon,
      fillOpacity: 0.04,
      strokeColor: N.neon,
      strokeOpacity: 0.15,
      strokeWeight: 1,
    });

    // Pins studios
    studios.forEach((studio) => {
      const marker = new gmaps.Marker({
        position: { lat: studio.latitude, lng: studio.longitude },
        map,
        title: studio.studio_name,
        animation: gmaps.Animation.DROP,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z',
          fillColor: N.neon,
          fillOpacity: 1,
          strokeColor: N.bg,
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: { x: 12, y: 22 } as unknown as { x: number; y: number },
        },
      });
      marker.addListener('click', () => onSelectStudio(studio));
    });
  }, [apiReady, userPos, studios, onSelectStudio]);

  if (apiError) {
    return (
      <div
        className="rounded-2xl border flex flex-col items-center justify-center gap-3 py-10"
        style={{ borderColor: N.border, background: N.surface, minHeight: 220 }}
      >
        <MapPin className="w-8 h-8 opacity-20" style={{ color: N.neon }} />
        <p className="text-sm text-center px-4" style={{ color: N.muted }}>
          Carte indisponible — ajoutez<br />
          <code className="text-xs" style={{ color: N.text }}>VITE_GOOGLE_MAPS_API_KEY</code>
          <br />dans votre .env
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: 260 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {!apiReady && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: N.surface }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: N.neon }} />
        </div>
      )}
      {/* Badge count */}
      {apiReady && studios.length > 0 && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)', color: N.neon }}
        >
          <MapPin className="w-3 h-3" />
          {studios.length} studio{studios.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
