"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import { usePlannerStore } from "@/store/plannerStore";

interface Stop {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
  sortOrder: number;
}

interface PlannerMapProps {
  stops: Stop[];
  encodedPolyline?: string;
}

function MapContent({ stops, encodedPolyline }: PlannerMapProps) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const { selectedStopId, setSelectedStopId } = usePlannerStore();

  // Fit bounds to stops
  useEffect(() => {
    if (!map || stops.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    stops.forEach((stop) => {
      bounds.extend({ lat: stop.lat, lng: stop.lng });
    });

    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [map, stops]);

  // Draw polyline
  useEffect(() => {
    if (!map) return;

    // Clear old polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (stops.length < 2) return;

    if (encodedPolyline) {
      // Use encoded polyline from Google Routes
      const path = google.maps.geometry?.encoding?.decodePath(encodedPolyline);
      if (path) {
        polylineRef.current = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: "#10b981",
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });
      }
    } else {
      // Fallback: straight lines
      const path = stops.map((s) => ({ lat: s.lat, lng: s.lng }));
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#10b981",
        strokeOpacity: 0.6,
        strokeWeight: 3,
        map,
      });
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, stops, encodedPolyline]);

  return (
    <>
      {stops.map((stop, index) => (
        <AdvancedMarker
          key={stop.id}
          position={{ lat: stop.lat, lng: stop.lng }}
          onClick={() => setSelectedStopId(stop.id)}
        >
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-lg transition-transform ${
              selectedStopId === stop.id
                ? "bg-emerald-500 text-white scale-125 ring-2 ring-emerald-300"
                : "bg-white text-zinc-800 hover:scale-110"
            }`}
          >
            {index + 1}
          </div>
        </AdvancedMarker>
      ))}
    </>
  );
}

export function PlannerMap({ stops, encodedPolyline }: PlannerMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // No API key — show placeholder map
  if (!apiKey || apiKey === "YOUR_BROWSER_API_KEY_HERE") {
    return <PlaceholderMap stops={stops} />;
  }

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 10.762622, lng: 106.660172 }}
          defaultZoom={12}
          mapId="viettrip-planner"
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        >
          <MapContent stops={stops} encodedPolyline={encodedPolyline} />
        </Map>
      </APIProvider>
    </div>
  );
}

// Placeholder map when no API key
function PlaceholderMap({ stops }: { stops: Stop[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedStopId, setSelectedStopId } = usePlannerStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (stops.length === 0) {
      ctx.fillStyle = "#52525b";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Thêm điểm dừng để xem bản đồ", w / 2, h / 2);
      return;
    }

    // Calculate bounds
    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padding = 60;
    const scaleX =
      maxLng !== minLng ? (w - padding * 2) / (maxLng - minLng) : 1;
    const scaleY =
      maxLat !== minLat ? (h - padding * 2) / (maxLat - minLat) : 1;
    const scale = Math.min(scaleX, scaleY);

    function toScreen(lat: number, lng: number) {
      return {
        x: padding + (lng - minLng) * scale,
        y: h - padding - (lat - minLat) * scale,
      };
    }

    // Draw route lines
    if (stops.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      const first = toScreen(stops[0].lat, stops[0].lng);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < stops.length; i++) {
        const p = toScreen(stops[i].lat, stops[i].lng);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw markers
    stops.forEach((stop, i) => {
      const p = toScreen(stop.lat, stop.lng);
      const isSelected = selectedStopId === stop.id;

      // Outer ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
        ctx.fill();
      }

      // Circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? "#10b981" : "#3f3f46";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#34d399" : "#52525b";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Number
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${i + 1}`, p.x, p.y);

      // Label
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "11px sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText(stop.placeName, p.x, p.y + 18);
    });

    // "No API key" notice
    ctx.fillStyle = "#52525b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("Preview mode — add Google Maps key for full map", w - 10, h - 10);
  }, [stops, selectedStopId]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
