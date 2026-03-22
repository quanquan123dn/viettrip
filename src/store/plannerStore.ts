import { create } from "zustand";

interface PlannerState {
  selectedDayId: string | null;
  selectedStopId: string | null;
  isReviewOpen: boolean;
  isAddStopOpen: boolean;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;

  setSelectedDayId: (id: string | null) => void;
  setSelectedStopId: (id: string | null) => void;
  setIsReviewOpen: (open: boolean) => void;
  setIsAddStopOpen: (open: boolean) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  selectedDayId: null,
  selectedStopId: null,
  isReviewOpen: false,
  isAddStopOpen: false,
  mapCenter: { lat: 10.762622, lng: 106.660172 }, // Ho Chi Minh City default
  mapZoom: 12,

  setSelectedDayId: (id) => set({ selectedDayId: id }),
  setSelectedStopId: (id) => set({ selectedStopId: id }),
  setIsReviewOpen: (open) => set({ isReviewOpen: open }),
  setIsAddStopOpen: (open) => set({ isAddStopOpen: open }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
}));
