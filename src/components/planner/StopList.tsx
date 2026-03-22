"use client";

import { StopCard } from "./StopCard";
import { Button } from "@/components/ui/button";
import { usePlannerStore } from "@/store/plannerStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface Stop {
  id: string;
  placeName: string;
  address?: string | null;
  lat: number;
  lng: number;
  startTime?: string | null;
  durationMinutes: number;
  note?: string | null;
  estimatedCost?: number | null;
  priority?: number | null;
  sortOrder: number;
}

interface StopListProps {
  stops: Stop[];
  tripId: string;
  dayId: string;
}

export function StopList({ stops, tripId, dayId }: StopListProps) {
  const { selectedStopId, setIsAddStopOpen } = usePlannerStore();
  const queryClient = useQueryClient();
  const [localStops, setLocalStops] = useState<Stop[]>(stops);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalStops(stops);
  }, [stops]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const reorderMutation = useMutation({
    mutationFn: async (stopIds: string[]) => {
      const res = await fetch(`/api/days/${dayId}/reorder-stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localStops.findIndex((s) => s.id === active.id);
    const newIndex = localStops.findIndex((s) => s.id === over.id);

    const newStops = arrayMove(localStops, oldIndex, newIndex);
    setLocalStops(newStops);
    reorderMutation.mutate(newStops.map((s) => s.id));
  }

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <span className="text-3xl">📍</span>
        </div>
        <h3 className="text-lg font-semibold text-zinc-300 mb-1">
          Chưa có điểm dừng nào
        </h3>
        <p className="text-sm text-zinc-500 mb-4">
          Thêm địa điểm để bắt đầu lên lịch
        </p>
        <Button
          onClick={() => setIsAddStopOpen(true)}
          className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
        >
          <span className="mr-2">+</span> Thêm điểm dừng
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          {localStops.length} điểm dừng
        </h2>
        <Button
          size="sm"
          onClick={() => setIsAddStopOpen(true)}
          className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 h-8"
        >
          <span className="mr-1">+</span> Thêm
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localStops.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="p-4 space-y-1">
              {localStops.map((stop, index) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  tripId={tripId}
                  isSelected={selectedStopId === stop.id}
                  isLast={index === localStops.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </div>
  );
}
