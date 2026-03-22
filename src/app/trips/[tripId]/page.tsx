"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { usePlannerStore } from "@/store/plannerStore";
import { TripHeader } from "@/components/planner/TripHeader";
import { DayTabs } from "@/components/planner/DayTabs";
import { StopList } from "@/components/planner/StopList";
import { AddStopDialog } from "@/components/planner/AddStopDialog";
import { PlannerMap } from "@/components/planner/PlannerMap";
import { RouteSummary } from "@/components/planner/RouteSummary";
import { Button } from "@/components/ui/button";
import type { DayRoute } from "@/types";
import { useMemo, useState } from "react";

export default function TripPlannerPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const { selectedDayId } = usePlannerStore();
  const queryClient = useQueryClient();
  const [routeData, setRouteData] = useState<Record<string, DayRoute>>({});
  const [mobileView, setMobileView] = useState<"stops" | "map">("stops");

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) throw new Error("Failed to load trip");
      return res.json();
    },
  });

  const computeRoute = useMutation({
    mutationFn: async (dayId: string) => {
      const res = await fetch(`/api/days/${dayId}/compute-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to compute route");
      return res.json();
    },
    onSuccess: (data, dayId) => {
      setRouteData((prev) => ({ ...prev, [dayId]: data }));
    },
  });

  const selectedDay = useMemo(() => {
    if (!trip?.days) return null;
    if (selectedDayId) {
      return trip.days.find(
        (d: { id: string }) => d.id === selectedDayId
      );
    }
    return trip.days[0];
  }, [trip, selectedDayId]);

  const currentRoute: DayRoute | null = useMemo(() => {
    if (!selectedDay) return null;

    // Check mutation result first
    if (routeData[selectedDay.id]) {
      return routeData[selectedDay.id];
    }

    // Check saved route snapshot
    const snapshot = selectedDay.routeSnapshots?.[0];
    if (snapshot) {
      return {
        totalDistanceMeters: snapshot.totalDistanceMeters,
        totalDurationSeconds: snapshot.totalDurationSeconds,
        encodedPolyline: snapshot.encodedPolyline || "",
        legs: snapshot.legsJson ? JSON.parse(snapshot.legsJson) : [],
      };
    }

    return null;
  }, [selectedDay, routeData]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
        {/* Header skeleton */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/80 animate-fade-in">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="space-y-1.5">
              <div className="h-5 w-48 skeleton" />
              <div className="h-3 w-32 skeleton" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 skeleton rounded-full" />
              <div className="h-7 w-16 skeleton rounded-full" />
            </div>
          </div>
        </div>
        {/* Nav bar skeleton */}
        <div className="h-10 border-b border-zinc-800 animate-fade-in delay-1" />
        {/* Body skeleton */}
        <div className="flex-1 flex overflow-hidden">
          <div className="w-56 border-r border-zinc-800 hidden md:block p-2 space-y-2 animate-fade-in delay-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 skeleton" />
            ))}
          </div>
          <div className="w-full md:w-96 border-r border-zinc-800 p-4 space-y-3 animate-fade-in delay-3">
            <div className="h-8 w-32 skeleton" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 skeleton" />
            ))}
          </div>
          <div className="flex-1 hidden lg:block animate-fade-in delay-4">
            <div className="h-full skeleton rounded-none" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">😔</span>
          </div>
          <p className="text-red-400 mb-4">Không tìm thấy chuyến đi</p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-zinc-700 text-zinc-300"
          >
            ← Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <TripHeader trip={trip} />

      {/* Back + mobile view toggle */}
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-zinc-400 hover:text-white h-7 text-xs"
        >
          ← Về Dashboard
        </Button>

        {/* Mobile view toggle */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            onClick={() => setMobileView("stops")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mobileView === "stops"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            📋 Lịch trình
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mobileView === "map"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            🗺️ Bản đồ
          </button>
        </div>
      </div>

      {/* Desktop: 3-column layout / Mobile: single column */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Day tabs — hidden on mobile */}
        <div className="w-56 border-r border-zinc-800 flex-shrink-0 hidden md:block">
          <DayTabs days={trip.days || []} tripId={tripId} />
        </div>

        {/* Mobile: Day tabs as horizontal scroll */}
        <div className="md:hidden border-b border-zinc-800 flex-shrink-0 overflow-x-auto scrollbar-hide">
          <div className="flex p-2 gap-1.5 min-w-max">
            {(trip.days || []).map(
              (day: { id: string; dayNumber: number; date: string; stops: { id: string }[] }) => {
                const isSelected = selectedDayId === day.id || (!selectedDayId && day.dayNumber === 1);
                return (
                  <button
                    key={day.id}
                    onClick={() => usePlannerStore.getState().setSelectedDayId(day.id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}
                  >
                    N{day.dayNumber} ({day.stops.length})
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Center: Stops */}
        <div
          className={`w-full md:w-96 border-r border-zinc-800 flex flex-col flex-shrink-0 ${
            mobileView !== "stops" ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedDay ? (
            <>
              <div className="flex-1 overflow-hidden">
                <StopList
                  stops={selectedDay.stops || []}
                  tripId={tripId}
                  dayId={selectedDay.id}
                />
              </div>
              <RouteSummary
                route={currentRoute}
                isLoading={computeRoute.isPending}
                stopsCount={selectedDay.stops?.length || 0}
                stops={selectedDay.stops || []}
                onComputeRoute={() => computeRoute.mutate(selectedDay.id)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-zinc-500">Chọn một ngày để xem lịch trình</p>
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div
          className={`flex-1 min-w-0 ${
            mobileView !== "map" ? "hidden lg:block" : "block"
          }`}
        >
          <PlannerMap
            stops={selectedDay?.stops || []}
            encodedPolyline={currentRoute?.encodedPolyline}
          />
        </div>
      </div>

      {/* Add Stop Dialog */}
      {selectedDay && (
        <AddStopDialog dayId={selectedDay.id} tripId={tripId} />
      )}
    </div>
  );
}
