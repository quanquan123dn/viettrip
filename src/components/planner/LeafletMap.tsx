"use client";

import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { usePlannerStore } from "@/store/plannerStore";

interface Stop {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
  sortOrder: number;
}

interface LeafletMapProps {
  stops: Stop[];
  encodedPolyline?: string;
}

// Custom numbered marker icon
// Colors are pre-inverted because the map container has CSS invert filter
function createNumberedIcon(num: number, isSelected: boolean) {
  const size = isSelected ? 36 : 30;
  const bg = isSelected ? "#ef5464" : "#d8d8d5";
  const border = isSelected ? "#cb2c3c" : "#adada7";
  const textColor = "black";
  const shadow = isSelected ? "0 0 12px rgba(239,84,100,0.5)" : "0 2px 6px rgba(255,255,255,0.2)";

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${bg};
      border:3px solid ${border};
      color:${textColor};
      display:flex;align-items:center;justify-content:center;
      font-weight:bold;font-size:${isSelected ? 15 : 13}px;
      box-shadow:${shadow};
      transition:all 0.2s;
      cursor:pointer;
    ">${num}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Component to auto-fit bounds when stops change
function FitBounds({ stops }: { stops: Stop[] }) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) return;

    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 14);
      return;
    }

    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, stops]);

  return null;
}

// Component to fly to selected stop
function FlyToSelected({ stops }: { stops: Stop[] }) {
  const map = useMap();
  const { selectedStopId } = usePlannerStore();

  useEffect(() => {
    if (!selectedStopId) return;
    const stop = stops.find((s) => s.id === selectedStopId);
    if (stop) {
      map.flyTo([stop.lat, stop.lng], Math.max(map.getZoom(), 14), {
        duration: 0.5,
      });
    }
  }, [map, selectedStopId, stops]);

  return null;
}

export default function LeafletMap({ stops, encodedPolyline }: LeafletMapProps) {
  const { selectedStopId, setSelectedStopId } = usePlannerStore();

  // Build polyline path from stops
  const polylinePath = useMemo(() => {
    if (stops.length < 2) return [];
    return stops.map((s) => [s.lat, s.lng] as [number, number]);
  }, [stops]);

  // Default center (Ho Chi Minh City)
  const center = useMemo(() => {
    if (stops.length === 0) return [10.762622, 106.660172] as [number, number];
    const avgLat = stops.reduce((s, st) => s + st.lat, 0) / stops.length;
    const avgLng = stops.reduce((s, st) => s + st.lng, 0) / stops.length;
    return [avgLat, avgLng] as [number, number];
  }, [stops]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={stops.length === 0 ? 6 : 12}
        style={{
          width: "100%",
          height: "100%",
          background: "#18181b",
          filter: "invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.2) saturate(0.3)",
        }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Standard OSM tiles — CSS filter creates dark mode */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Fit bounds to stops */}
        <FitBounds stops={stops} />
        <FlyToSelected stops={stops} />

        {/* Route polyline */}
        {/* Pre-inverted colors (CSS filter inverts back to emerald) */}
        {polylinePath.length > 1 && (
          <>
            {/* Glow effect */}
            <Polyline
              positions={polylinePath}
              pathOptions={{
                color: "#ef5464",
                weight: 8,
                opacity: 0.15,
              }}
            />
            {/* Main line */}
            <Polyline
              positions={polylinePath}
              pathOptions={{
                color: "#ef5464",
                weight: 3,
                opacity: 0.8,
                dashArray: "8, 6",
              }}
            />
          </>
        )}

        {/* Markers */}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createNumberedIcon(index + 1, selectedStopId === stop.id)}
            eventHandlers={{
              click: () => setSelectedStopId(stop.id),
            }}
          />
        ))}
      </MapContainer>

      {/* Attribution overlay */}
      <div className="absolute bottom-1 right-2 text-[9px] text-zinc-600 z-[1000]">
        © OpenStreetMap
      </div>

      {/* Empty state */}
      {stops.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="text-center">
            <span className="text-4xl block mb-2">🗺️</span>
            <p className="text-sm text-zinc-500">
              Thêm điểm dừng để xem trên bản đồ
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
