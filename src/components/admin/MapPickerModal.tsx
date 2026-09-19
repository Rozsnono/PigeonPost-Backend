"use client";
import React, { useState, useEffect, useRef } from 'react';

interface MapPickerModalProps {
  visible: boolean;
  initialLat: number;
  initialLng: number;
  onSelect: (result: { lat: number; lng: number; cityName?: string; countryName?: string }) => void;
  onClose: () => void;
}

export default function MapPickerModal({
  visible,
  initialLat,
  initialLng,
  onSelect,
  onClose,
}: MapPickerModalProps) {
  const [coords, setCoords] = useState({ lat: initialLat || 47.4979, lng: initialLng || 19.0402 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ city?: string; country?: string } | null>(null);

  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      setCoords({ lat: initialLat || 47.4979, lng: initialLng || 19.0402 });
      setDetectedLocation(null);
      setSearchQuery('');
    }
  }, [visible, initialLat, initialLng]);

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;

    const setupLeaflet = async () => {
      // 1. Ensure Leaflet CSS is present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Ensure Leaflet JS is present
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      if (!isMounted) return;

      const L = (window as any).L;
      if (!L) return;

      // Fix default Leaflet marker icon paths when loaded from CDN
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const container = document.getElementById('map-picker-canvas');
      if (!container) return;

      // Reset existing leaflet instance on container if any
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
      }

      const startLat = initialLat || 47.4979;
      const startLng = initialLng || 19.0402;

      const map = L.map('map-picker-canvas', {
        center: [startLat, startLng],
        zoom: 6,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // High quality Carto Voyager tile layer (crisp & detailed worldwide)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Marker
      const marker = L.marker([startLat, startLng], {
        draggable: true,
      }).addTo(map);

      markerRef.current = marker;

      // Drag event
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCoords({
          lat: Number(pos.lat.toFixed(4)),
          lng: Number(pos.lng.toFixed(4)),
        });
      });

      // Click on map event
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setCoords({
          lat: Number(e.latlng.lat.toFixed(4)),
          lng: Number(e.latlng.lng.toFixed(4)),
        });
      });

      // Ensure proper rendering without gray tiles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    };

    setupLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [visible]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&addressdetails=1&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'hu,en' } });
      const data = await res.json();

      if (data && data.length > 0) {
        const hit = data[0];
        const newLat = Number(parseFloat(hit.lat).toFixed(4));
        const newLng = Number(parseFloat(hit.lon).toFixed(4));

        setCoords({ lat: newLat, lng: newLng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLng], 11, { duration: 1.4 });
          markerRef.current.setLatLng([newLat, newLng]);
        }

        // Detect city and country
        const addr = hit.address || {};
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.state || hit.name;
        const country = addr.country || '';
        if (city || country) {
          setDetectedLocation({ city, country });
        }
      } else {
        alert('Nem található ilyen helyszín. Próbálj meg más kifejezést!');
      }
    } catch (err: any) {
      console.error('Nominatim search error:', err);
      alert('Keresési hiba történt.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    onSelect({
      lat: coords.lat,
      lng: coords.lng,
      cityName: detectedLocation?.city,
      countryName: detectedLocation?.country,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#0e1320',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18,
          width: '100%',
          maxWidth: 820,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'rgba(99,102,241,0.18)',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              🗺️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>
                Helyszín Kijelölése a Térképen
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                Kattints bárhova a Földön, vagy húzd a tűt a kívánt koordinátákra!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(15,21,36,0.95)',
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gyorskeresés név alapján (pl. Tokió, Barcelona, Bécs, Sydney)..."
              style={{
                flex: 1,
                padding: '9px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 9,
                color: '#f1f5f9',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              style={{
                padding: '9px 18px',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: isSearching || !searchQuery.trim() ? 0.6 : 1,
              }}
            >
              {isSearching ? 'Keresés...' : '🔍 Ugrás oda'}
            </button>
          </form>

          {detectedLocation && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>✓ Találat:</span>
              <strong style={{ color: '#f1f5f9' }}>
                {detectedLocation.city}
                {detectedLocation.country ? `, ${detectedLocation.country}` : ''}
              </strong>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div style={{ position: 'relative', height: 420, width: '100%', background: '#111827' }}>
          <div id="map-picker-canvas" style={{ width: '100%', height: '100%' }} />

          {/* Floating Live Coordinates Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              zIndex: 1000,
              background: 'rgba(11,15,26,0.92)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: 10,
              padding: '6px 14px',
              color: '#f1f5f9',
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: '#818cf8' }}>📍 Kijelölt pozíció:</span>
            <span style={{ fontFamily: 'monospace', color: '#fbbf24' }}>
              Lat: {coords.lat}° · Lng: {coords.lng}°
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Kiválasztva: <strong style={{ color: '#f1f5f9' }}>{coords.lat}, {coords.lng}</strong>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Mégse
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                padding: '9px 20px',
                background: 'linear-gradient(135deg,#10b981,#059669)',
                border: 'none',
                borderRadius: 8,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              }}
            >
              ✓ Helyzet Alkalmazása
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
