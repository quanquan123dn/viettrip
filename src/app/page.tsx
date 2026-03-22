"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTripDialog } from "@/components/planner/CreateTripDialog";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

const STYLE_CONFIG: Record<string, { emoji: string; gradient: string }> = {
  CHILL: { emoji: "🏖️", gradient: "from-blue-600/20 to-cyan-600/20" },
  EXPLORE: { emoji: "🧭", gradient: "from-orange-600/20 to-amber-600/20" },
  FOOD: { emoji: "🍜", gradient: "from-red-600/20 to-pink-600/20" },
  NATURE: { emoji: "🌿", gradient: "from-green-600/20 to-emerald-600/20" },
  SPIRITUAL: { emoji: "🛕", gradient: "from-purple-600/20 to-violet-600/20" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Bản nháp", color: "bg-zinc-700/50 text-zinc-400" },
  active: { label: "Đang đi", color: "bg-emerald-500/20 text-emerald-300" },
  completed: { label: "Hoàn thành", color: "bg-blue-500/20 text-blue-300" },
};

const formatCost = (cost: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(cost);

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips");
      if (!res.ok) throw new Error("Failed to load trips");
      return res.json();
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setDeletingId(null);
      toast.success("Đã xóa chuyến đi!");
    },
    onError: () => {
      toast.error("Không thể xóa chuyến đi");
    },
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-zinc-950 to-teal-900/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-10 w-[200px] h-[200px] bg-teal-500/3 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 left-10 w-[150px] h-[150px] bg-emerald-400/3 rounded-full blur-2xl animate-pulse [animation-delay:1s]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="animate-fade-in-up flex items-center gap-3 mb-2">
            <span className="text-3xl sm:text-4xl animate-float">✈️</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              VietTrip
            </h1>
          </div>
          <p className="animate-fade-in-up delay-2 text-zinc-400 text-base sm:text-lg mt-2 max-w-xl">
            Lên kế hoạch chuyến đi hoàn hảo — lịch trình từng ngày, bản đồ trực
            quan, review thông minh.
          </p>
          <div className="animate-fade-in-up delay-4 mt-6 sm:mt-8">
            <CreateTripDialog />
          </div>
        </div>
      </div>

      {/* Trip list */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold text-zinc-200">
            Chuyến đi của bạn
          </h2>
          {trips && trips.length > 0 && (
            <span className="text-sm text-zinc-500">
              {trips.length} chuyến đi
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-52 skeleton border border-zinc-800 animate-fade-in-up delay-${i * 2}`}
              />
            ))}
          </div>
        ) : trips?.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl animate-float">🗺️</span>
            </div>
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">
              Chưa có chuyến đi nào
            </h3>
            <p className="text-zinc-500 mb-6">
              Tạo chuyến đi đầu tiên để bắt đầu khám phá!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips?.map(
              (trip: {
                id: string;
                title: string;
                startDate: string;
                endDate: string;
                travelMode: string;
                tripStyle: string;
                status: string;
                days: { stops: { estimatedCost?: number | null }[] }[];
              }, index: number) => {
                const style = STYLE_CONFIG[trip.tripStyle] || STYLE_CONFIG.EXPLORE;
                const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft;
                const totalStops = trip.days?.reduce(
                  (acc: number, d: { stops: unknown[] }) =>
                    acc + (d.stops?.length || 0),
                  0
                ) || 0;
                const totalCost = trip.days?.reduce(
                  (acc: number, d: { stops: { estimatedCost?: number | null }[] }) =>
                    acc + d.stops.reduce(
                      (s: number, stop: { estimatedCost?: number | null }) => s + (stop.estimatedCost || 0),
                      0
                    ),
                  0
                ) || 0;

                const isDeleting = deletingId === trip.id;

                return (
                  <div
                    key={trip.id}
                    className={`relative text-left rounded-xl border border-zinc-800 bg-gradient-to-br ${style.gradient} hover:border-zinc-700 transition-all duration-300 group overflow-hidden animate-fade-in-up`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {/* Delete confirmation overlay */}
                    {isDeleting && (
                      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-xl animate-fade-in">
                        <p className="text-sm text-zinc-300">Xóa chuyến đi này?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteTrip.mutate(trip.id)}
                            disabled={deleteTrip.isPending}
                            className="px-4 py-1.5 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            {deleteTrip.isPending ? "..." : "Xóa"}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-4 py-1.5 text-sm bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => router.push(`/trips/${trip.id}`)}
                      className="w-full text-left p-5 hover:scale-[1.01] transition-transform"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{style.emoji}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                            {trip.days?.length || 0} ngày
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                        {trip.title}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-3">
                        {(() => {
                          try {
                            return `${format(new Date(trip.startDate), "dd/MM", {
                              locale: vi,
                            })} — ${format(new Date(trip.endDate), "dd/MM/yyyy", {
                              locale: vi,
                            })}`;
                          } catch {
                            return "";
                          }
                        })()}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span>📍 {totalStops} điểm</span>
                        <span>
                          {trip.travelMode === "MOTORBIKE" ? "🏍️" : "🚗"}
                        </span>
                        {totalCost > 0 && (
                          <span className="text-emerald-400/80">
                            💰 {formatCost(totalCost)}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Delete button — visible on mobile via opacity, hover on desktop */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(trip.id);
                      }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-zinc-800/70 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all text-xs z-5"
                    >
                      🗑️
                    </button>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
