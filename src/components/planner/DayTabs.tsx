"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";

interface DayTabsProps {
  days: {
    id: string;
    dayNumber: number;
    date: string;
    notes?: string | null;
    stops: { id: string; estimatedCost?: number | null }[];
  }[];
  tripId: string;
}

export function DayTabs({ days, tripId }: DayTabsProps) {
  const { selectedDayId, setSelectedDayId } = usePlannerStore();
  const queryClient = useQueryClient();
  const [editingNote, setEditingNote] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-select first day if none selected
  if (!selectedDayId && days.length > 0) {
    setSelectedDayId(days[0].id);
  }

  // Sync note text when selected day changes
  const selectedDay = days.find((d) => d.id === selectedDayId);
  useEffect(() => {
    setEditingNote(selectedDay?.notes || "");
  }, [selectedDayId, selectedDay?.notes]);

  const updateNotes = useMutation({
    mutationFn: async ({ dayId, notes }: { dayId: string; notes: string }) => {
      const res = await fetch(`/api/days/${dayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to update notes");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });

  const handleNoteChange = useCallback(
    (value: string) => {
      setEditingNote(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (selectedDayId) {
          updateNotes.mutate({ dayId: selectedDayId, notes: value });
        }
      }, 800);
    },
    [selectedDayId, updateNotes]
  );

  const formatCost = (cost: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(cost);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/50">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Lịch trình
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {days.map((day) => {
            const isSelected = selectedDayId === day.id;
            const dateStr = (() => {
              try {
                return format(new Date(day.date), "EEE, dd/MM", { locale: vi });
              } catch {
                return `Ngày ${day.dayNumber}`;
              }
            })();

            const dayCost =
              day.stops?.reduce(
                (acc, s) => acc + (s.estimatedCost || 0),
                0
              ) || 0;

            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg transition-all duration-200 group",
                  isSelected
                    ? "bg-emerald-500/15 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                    : "hover:bg-zinc-800/50 border border-transparent"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isSelected ? "text-emerald-400" : "text-zinc-300"
                      )}
                    >
                      Ngày {day.dayNumber}
                    </span>
                    <p
                      className={cn(
                        "text-xs mt-0.5",
                        isSelected ? "text-emerald-400/70" : "text-zinc-500"
                      )}
                    >
                      {dateStr}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-zinc-800 text-zinc-500"
                      )}
                    >
                      {day.stops.length} điểm
                    </span>
                    {dayCost > 0 && (
                      <span className="text-[10px] text-emerald-400/70">
                        {formatCost(dayCost)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Note preview for non-selected days */}
                {!isSelected && day.notes && (
                  <p className="text-[10px] text-zinc-600 mt-1 truncate italic">
                    📝 {day.notes}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Notes section for selected day */}
      {selectedDay && (
        <div className="border-t border-zinc-800 p-3">
          <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-1.5 mb-2">
            📝 Ghi chú ngày {selectedDay.dayNumber}
            {updateNotes.isPending && (
              <span className="text-[10px] text-emerald-400 animate-pulse">
                đang lưu...
              </span>
            )}
          </label>
          <textarea
            value={editingNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Ghi chú cho ngày này..."
            rows={3}
            className="w-full text-xs bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      )}
    </div>
  );
}
