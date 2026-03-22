"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ShareDialog } from "./ShareDialog";

interface TripHeaderProps {
  trip: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    travelMode: string;
    tripStyle: string;
    status: string;
    days?: {
      stops: { estimatedCost?: number | null }[];
    }[];
  };
}

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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Bản nháp", color: "bg-zinc-700/50 text-zinc-400 border-zinc-600" },
  active: { label: "Đang đi", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  completed: { label: "Hoàn thành", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

export function TripHeader({ trip }: TripHeaderProps) {
  const style = STYLE_CONFIG[trip.tripStyle] || STYLE_CONFIG.EXPLORE;
  const mode = MODE_CONFIG[trip.travelMode] || MODE_CONFIG.DRIVE;
  const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Compute totals
  const totalStops = trip.days?.reduce(
    (acc, d) => acc + (d.stops?.length || 0),
    0
  ) || 0;

  const totalCost = trip.days?.reduce(
    (acc, d) =>
      acc +
      d.stops?.reduce(
        (s, stop) => s + (stop.estimatedCost || 0),
        0
      ),
    0
  ) || 0;

  const formatCost = (cost: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(cost);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
    } catch {
      return dateStr;
    }
  };

  const deleteTrip = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("Đã xóa chuyến đi!");
      router.push("/");
    },
    onError: () => {
      toast.error("Không thể xóa chuyến đi");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      toast.success("Đã cập nhật trạng thái!");
    },
  });

  return (
    <>
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">{trip.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs sm:text-sm text-zinc-400">
                {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
              </span>
              {totalStops > 0 && (
                <span className="text-xs text-zinc-500">• 📍 {totalStops} điểm</span>
              )}
              {totalCost > 0 && (
                <span className="text-xs text-emerald-400 font-medium">
                  • 💰 {formatCost(totalCost)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Badge variant="outline" className={`${style.color} hidden sm:inline-flex`}>
            {style.emoji} {style.label}
          </Badge>
          <Badge variant="outline" className="bg-zinc-800/50 text-zinc-300 border-zinc-700 hidden sm:inline-flex">
            {mode.emoji} {mode.label}
          </Badge>

          {/* Status dropdown */}
          <button
            onClick={() => {
              const statuses = ["draft", "active", "completed"];
              const idx = statuses.indexOf(trip.status);
              const next = statuses[(idx + 1) % statuses.length];
              updateStatus.mutate(next);
            }}
            className="group"
          >
            <Badge variant="outline" className={`${status.color} cursor-pointer hover:opacity-80 transition-opacity`}>
              {status.label}
            </Badge>
          </button>

          {/* Share */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShareOpen(true)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 px-2 sm:px-3"
          >
            <span className="sm:hidden">🔗</span>
            <span className="hidden sm:inline">🔗 Chia sẻ</span>
          </Button>

          {/* Delete */}
          {deleteConfirm ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteTrip.mutate()}
                disabled={deleteTrip.isPending}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 px-2 text-xs"
              >
                {deleteTrip.isPending ? "..." : "Xóa"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteConfirm(false)}
                className="text-zinc-500 h-8 px-2 text-xs"
              >
                Hủy
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteConfirm(true)}
              className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-2"
            >
              🗑️
            </Button>
          )}
        </div>
      </div>

      <ShareDialog tripId={trip.id} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
