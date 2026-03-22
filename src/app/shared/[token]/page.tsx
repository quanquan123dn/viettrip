"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const STYLE_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  CHILL: { emoji: "🏖️", label: "Chill", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  EXPLORE: { emoji: "🧭", label: "Khám phá", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  FOOD: { emoji: "🍜", label: "Ẩm thực", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  NATURE: { emoji: "🌿", label: "Thiên nhiên", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  SPIRITUAL: { emoji: "🛕", label: "Tâm linh", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

const MODE_CONFIG: Record<string, { emoji: string; label: string }> = {
  DRIVE: { emoji: "🚗", label: "Ô tô" },
  MOTORBIKE: { emoji: "🏍️", label: "Xe máy" },
};

const formatCost = (cost: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(cost);

export default function SharedTripPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-trip", token],
    queryFn: async () => {
      const res = await fetch(`/api/shared/${token}`);
      if (!res.ok) throw new Error("Failed to load shared trip");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-400">Đang tải chuyến đi...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.trip) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Link không hợp lệ hoặc đã hết hạn</h2>
          <p className="text-zinc-400 mb-6">Vui lòng liên hệ người chia sẻ để lấy link mới.</p>
          <Button onClick={() => router.push("/")} variant="outline" className="border-zinc-700 text-zinc-300">
            ← Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const trip = data.trip;
  const styleConfig = STYLE_CONFIG[trip.tripStyle] || STYLE_CONFIG.EXPLORE;
  const modeConfig = MODE_CONFIG[trip.travelMode] || MODE_CONFIG.DRIVE;
  const selectedDay = trip.days?.[selectedDayIndex];

  const totalCost = trip.days?.reduce(
    (acc: number, day: { stops: { estimatedCost?: number | null }[] }) =>
      acc + day.stops.reduce((s: number, stop: { estimatedCost?: number | null }) => s + (stop.estimatedCost || 0), 0),
    0
  ) || 0;

  const totalStops = trip.days?.reduce(
    (acc: number, day: { stops: unknown[] }) => acc + day.stops.length,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Shared banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-amber-300 flex items-center gap-1.5">
            👁️ Chế độ xem — được chia sẻ bởi chủ trip
          </span>
          <Button
            onClick={() => router.push("/")}
            size="sm"
            variant="ghost"
            className="text-xs text-amber-300 hover:text-amber-200 h-7"
          >
            Tạo trip của bạn →
          </Button>
        </div>
      </div>

      {/* Trip header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{trip.title}</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {(() => {
                try {
                  return `${format(new Date(trip.startDate), "dd/MM", { locale: vi })} — ${format(new Date(trip.endDate), "dd/MM/yyyy", { locale: vi })}`;
                } catch {
                  return "";
                }
              })()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={styleConfig.color}>
              {styleConfig.emoji} {styleConfig.label}
            </Badge>
            <Badge variant="outline" className="bg-zinc-800/50 text-zinc-300 border-zinc-700">
              {modeConfig.emoji} {modeConfig.label}
            </Badge>
            <Badge variant="outline" className="bg-zinc-800/50 text-zinc-300 border-zinc-700">
              📍 {totalStops} điểm
            </Badge>
            {totalCost > 0 && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                💰 {formatCost(totalCost)}
              </Badge>
            )}
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {trip.days?.map((day: { id: string; dayNumber: number; date: string; stops: unknown[] }, index: number) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayIndex(index)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedDayIndex === index
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <span className="block">Ngày {day.dayNumber}</span>
              <span className="text-xs opacity-70">{day.stops.length} điểm</span>
            </button>
          ))}
        </div>

        {/* Day content */}
        {selectedDay && (
          <div className="space-y-3">
            {selectedDay.stops?.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500">Ngày này chưa có lịch trình</p>
              </div>
            ) : (
              selectedDay.stops?.map(
                (
                  stop: {
                    id: string;
                    placeName: string;
                    address?: string;
                    startTime?: string;
                    durationMinutes: number;
                    estimatedCost?: number | null;
                    note?: string;
                  },
                  index: number
                ) => (
                  <div
                    key={stop.id}
                    className="flex gap-4 group"
                  >
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400">
                        {index + 1}
                      </div>
                      {index < (selectedDay.stops?.length || 0) - 1 && (
                        <div className="w-0.5 flex-1 bg-zinc-800 mt-1.5" />
                      )}
                    </div>

                    {/* Card */}
                    <div className="flex-1 pb-4">
                      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                        <h3 className="font-semibold text-white">{stop.placeName}</h3>
                        {stop.address && (
                          <p className="text-xs text-zinc-500 mt-0.5">📍 {stop.address}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {stop.startTime && (
                            <span className="text-xs text-zinc-400">🕐 {stop.startTime}</span>
                          )}
                          <span className="text-xs text-zinc-400">⏱️ {stop.durationMinutes} phút</span>
                          {stop.estimatedCost != null && stop.estimatedCost > 0 && (
                            <span className="text-xs text-emerald-400">💰 {formatCost(stop.estimatedCost)}</span>
                          )}
                        </div>
                        {stop.note && (
                          <p className="text-xs text-zinc-500 mt-2 italic">💬 {stop.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )
            )}

            {/* Day cost summary */}
            {(() => {
              const dayCost = selectedDay.stops?.reduce(
                (acc: number, s: { estimatedCost?: number | null }) => acc + (s.estimatedCost || 0),
                0
              ) || 0;
              if (dayCost <= 0) return null;
              return (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Chi phí ngày {selectedDay.dayNumber}</span>
                    <span className="text-sm font-semibold text-emerald-400">{formatCost(dayCost)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
