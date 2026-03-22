"use client";

import type { DayRoute } from "@/types";

interface RouteSummaryProps {
  route: DayRoute | null;
  isLoading: boolean;
  stopsCount: number;
  stops?: { estimatedCost?: number | null; durationMinutes?: number }[];
  onComputeRoute: () => void;
}

export function RouteSummary({
  route,
  isLoading,
  stopsCount,
  stops = [],
  onComputeRoute,
}: RouteSummaryProps) {
  const totalCost = stops.reduce(
    (acc, s) => acc + (s.estimatedCost || 0),
    0
  );
  const totalDuration = stops.reduce(
    (acc, s) => acc + (s.durationMinutes || 0),
    0
  );

  const formatCost = (cost: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(cost);

  if (stopsCount < 2) {
    return (
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/80">
        {/* Show cost even with < 2 stops */}
        {stopsCount > 0 && (totalCost > 0 || totalDuration > 0) && (
          <div className="flex items-center justify-center gap-4 mb-2">
            {totalDuration > 0 && (
              <span className="text-xs text-zinc-400">
                ⏱️ {Math.floor(totalDuration / 60) > 0 ? `${Math.floor(totalDuration / 60)}h ` : ""}{totalDuration % 60}p tham quan
              </span>
            )}
            {totalCost > 0 && (
              <span className="text-xs text-emerald-400 font-medium">
                💰 {formatCost(totalCost)}
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-zinc-500 text-center">
          Thêm ít nhất 2 điểm để tính route
        </p>
      </div>
    );
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}p` : ""}`;
    }
    return `${minutes} phút`;
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/80">
      {/* Cost summary bar */}
      {(totalCost > 0 || totalDuration > 0) && (
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {totalDuration > 0 && (
              <span className="text-xs text-zinc-400">
                ⏱️ {Math.floor(totalDuration / 60) > 0 ? `${Math.floor(totalDuration / 60)}h ` : ""}{totalDuration % 60}p tham quan
              </span>
            )}
          </div>
          {totalCost > 0 && (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              💰 {formatCost(totalCost)}
            </span>
          )}
        </div>
      )}

      {route ? (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
              Tổng quan route
            </span>
            <button
              onClick={onComputeRoute}
              disabled={isLoading}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {isLoading ? "Đang tính..." : "↻ Tính lại"}
            </button>
          </div>

          <div className={`grid ${totalCost > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            <div className="bg-zinc-800/50 rounded-lg p-2.5">
              <p className="text-xs text-zinc-500 mb-0.5">Quãng đường</p>
              <p className="text-sm font-semibold text-white">
                🛣️ {formatDistance(route.totalDistanceMeters)}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-2.5">
              <p className="text-xs text-zinc-500 mb-0.5">Thời gian lái</p>
              <p className="text-sm font-semibold text-white">
                🕐 {formatDuration(route.totalDurationSeconds)}
              </p>
            </div>
            {totalCost > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5">
                <p className="text-xs text-zinc-500 mb-0.5">Chi phí</p>
                <p className="text-sm font-semibold text-emerald-400">
                  💰 {formatCost(totalCost)}
                </p>
              </div>
            )}
          </div>

          {/* Per-leg breakdown */}
          {route.legs.length > 0 && (
            <div className="mt-3 space-y-1">
              {route.legs.map((leg, i) => (
                <div
                  key={i}
                  className="flex items-center text-xs text-zinc-400 gap-2"
                >
                  <span className="w-4 text-center text-zinc-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate">
                    {leg.startPlaceName} → {leg.endPlaceName}
                  </span>
                  <span className="text-zinc-500 whitespace-nowrap">
                    {formatDistance(leg.distanceMeters)}
                  </span>
                  <span className="text-zinc-500 whitespace-nowrap">
                    {formatDuration(leg.durationSeconds)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 text-center">
          <button
            onClick={onComputeRoute}
            disabled={isLoading}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Đang tính route...
              </span>
            ) : (
              "🗺️ Tính route cho ngày này"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
