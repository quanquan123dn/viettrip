"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePlannerStore } from "@/store/plannerStore";
import dynamic from "next/dynamic";

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

// Lazy-load the Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Đang tải bản đồ...</span>
      </div>
    </div>
  ),
});

export function PlannerMap({ stops, encodedPolyline }: PlannerMapProps) {
  return <LeafletMap stops={stops} encodedPolyline={encodedPolyline} />;
}
