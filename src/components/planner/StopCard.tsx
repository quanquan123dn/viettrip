"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePlannerStore } from "@/store/plannerStore";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface StopCardProps {
  stop: {
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
  };
  index: number;
  tripId: string;
  isSelected: boolean;
  isLast: boolean;
}

export function StopCard({ stop, index, tripId, isSelected, isLast }: StopCardProps) {
  const { setSelectedStopId } = usePlannerStore();
  const queryClient = useQueryClient();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const deleteStop = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/stops/${stop.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.success("Đã xóa điểm dừng!");
    },
    onError: () => {
      toast.error("Không thể xóa điểm dừng");
    },
  });

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(cost);
  };

  const priorityColors: Record<number, string> = {
    1: "bg-red-500/20 text-red-300",
    2: "bg-orange-500/20 text-orange-300",
    3: "bg-yellow-500/20 text-yellow-300",
    4: "bg-blue-500/20 text-blue-300",
    5: "bg-zinc-500/20 text-zinc-400",
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Timeline connector */}
      <div className="absolute left-5 top-0 bottom-0 flex flex-col items-center z-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
            isSelected
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              : "bg-zinc-800 text-zinc-300 border border-zinc-700"
          }`}
        >
          {index + 1}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-zinc-800 mt-1" />
        )}
      </div>

      {/* Card content */}
      <div
        onClick={() => setSelectedStopId(stop.id)}
        className={`ml-14 p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
          isSelected
            ? "bg-emerald-500/10 border border-emerald-500/30 shadow-sm"
            : "bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
        } ${isDragging ? "shadow-xl shadow-black/30 ring-1 ring-emerald-500/40" : ""}`}
      >
        <div className="flex items-start justify-between">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="mr-2 mt-0.5 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {stop.placeName}
            </h3>
            {stop.address && (
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                📍 {stop.address}
              </p>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStop.mutate();
                  }}
                />
              }
            >
              ✕
            </TooltipTrigger>
            <TooltipContent>Xóa điểm dừng</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {stop.startTime && (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              🕐 {stop.startTime}
            </span>
          )}
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            ⏱️ {stop.durationMinutes} phút
          </span>
          {stop.estimatedCost != null && stop.estimatedCost > 0 && (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              💰 {formatCost(stop.estimatedCost)}
            </span>
          )}
          {stop.priority != null && stop.priority !== 3 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                priorityColors[stop.priority] || priorityColors[3]
              }`}
            >
              P{stop.priority}
            </span>
          )}
        </div>

        {stop.note && (
          <p className="text-xs text-zinc-500 mt-2 italic">💬 {stop.note}</p>
        )}
      </div>
    </div>
  );
}
