"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePlannerStore } from "@/store/plannerStore";

interface AddStopDialogProps {
  dayId: string;
  tripId: string;
}

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export function AddStopDialog({ dayId, tripId }: AddStopDialogProps) {
  const { isAddStopOpen, setIsAddStopOpen } = usePlannerStore();
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [note, setNote] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [placeSelected, setPlaceSelected] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  // Search using Nominatim (OpenStreetMap) — free, no API key needed
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "6",
        countrycodes: "vn",
        "accept-language": "vi",
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            "User-Agent": "VietTrip/1.0",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSearchResults(
          data.map((item: { place_id: number; display_name: string; name?: string; lat: string; lon: string }) => ({
            id: String(item.place_id),
            name: item.name || item.display_name.split(",")[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
        );
      }
    } catch {
      // Silently fail
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPlaceSelected(false);
    setShowResults(true);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPlaces(value), 400);
  };

  // Select a place from results
  const selectPlace = (place: PlaceResult) => {
    setPlaceName(place.name);
    setAddress(place.address);
    setLat(place.lat.toString());
    setLng(place.lng.toString());
    setSearchQuery(place.name);
    setPlaceSelected(true);
    setShowResults(false);
    setSearchResults([]);
  };

  const addStop = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/days/${dayId}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add stop");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      setIsAddStopOpen(false);
      resetForm();
      toast.success("Đã thêm điểm dừng!");
    },
    onError: () => {
      toast.error("Không thể thêm điểm dừng");
    },
  });

  function resetForm() {
    setPlaceName("");
    setAddress("");
    setLat("");
    setLng("");
    setStartTime("");
    setDurationMinutes("60");
    setNote("");
    setEstimatedCost("");
    setSearchQuery("");
    setSearchResults([]);
    setPlaceSelected(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addStop.mutate({
      placeName,
      address: address || undefined,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      startTime: startTime || undefined,
      durationMinutes: parseInt(durationMinutes) || 60,
      note: note || undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
    });
  }

  // Quick add popular places (Vietnam)
  const quickPlaces = [
    { name: "Bến Nhà Rồng", lat: 10.7678, lng: 106.7052 },
    { name: "Chợ Bến Thành", lat: 10.7725, lng: 106.698 },
    { name: "Nhà thờ Đức Bà", lat: 10.7798, lng: 106.699 },
    { name: "Phố đi bộ Nguyễn Huệ", lat: 10.7737, lng: 106.7026 },
    { name: "Dinh Độc Lập", lat: 10.7769, lng: 106.6952 },
    { name: "Chùa Vĩnh Nghiêm", lat: 10.7942, lng: 106.6873 },
  ];

  return (
    <Dialog open={isAddStopOpen} onOpenChange={setIsAddStopOpen}>
      <DialogContent className="sm:max-w-[520px] bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            📍 Thêm điểm dừng
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Tìm kiếm địa điểm hoặc chọn nhanh bên dưới
          </DialogDescription>
        </DialogHeader>

        {/* Place Search */}
        <div className="mt-2 relative">
          <Label className="text-zinc-300 text-sm font-medium">
            🔍 Tìm kiếm địa điểm
          </Label>
          <div className="relative mt-1.5">
            <Input
              placeholder="VD: Chợ Bến Thành, Bún chả Hà Nội, Bãi biển Mỹ Khê..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0 && !placeSelected) setShowResults(true);
              }}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {placeSelected && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                ✓
              </div>
            )}
          </div>

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-[250px] overflow-y-auto">
              {searchResults.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => selectPlace(place)}
                  className="w-full text-left px-3 py-2.5 hover:bg-zinc-700/50 transition-colors border-b border-zinc-700/50 last:border-0"
                >
                  <div className="text-sm text-white font-medium">
                    {place.name}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                    {place.address}
                  </div>
                </button>
              ))}
              <div className="px-3 py-1.5 text-[10px] text-zinc-600 bg-zinc-800/50">
                Powered by OpenStreetMap
              </div>
            </div>
          )}
        </div>

        {/* Quick place picker */}
        <div className="mt-1">
          <Label className="text-zinc-400 text-xs">Chọn nhanh (HCM)</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {quickPlaces.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setPlaceName(p.name);
                  setAddress(p.name);
                  setLat(p.lat.toString());
                  setLng(p.lng.toString());
                  setSearchQuery(p.name);
                  setPlaceSelected(true);
                  setShowResults(false);
                }}
                className="text-xs px-2.5 py-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 border border-zinc-700 transition-all"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Place info — auto-filled by search, or manual entry */}
          <div className="space-y-2">
            <Label className="text-zinc-300">
              Tên địa điểm *
              {placeSelected && (
                <span className="text-emerald-400 text-xs ml-2">✓ đã chọn</span>
              )}
            </Label>
            <Input
              placeholder="VD: Chợ Bến Thành"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Địa chỉ</Label>
            <Input
              placeholder="VD: Lê Lợi, Quận 1"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Lat/Lng — hidden when auto-filled */}
          {!placeSelected && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">Latitude *</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="10.7725"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Longitude *</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="106.6980"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
          )}

          {/* Compact coordinates display when selected */}
          {placeSelected && lat && lng && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2">
              <span>📍</span>
              <span>{parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}</span>
              <button
                type="button"
                onClick={() => setPlaceSelected(false)}
                className="ml-auto text-zinc-400 hover:text-white"
              >
                Sửa
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Giờ bắt đầu</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Thời gian (phút)</Label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Chi phí ước tính (VNĐ)</Label>
            <Input
              type="number"
              placeholder="100000"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Ghi chú</Label>
            <Textarea
              placeholder="VD: Nhớ thử cơm tấm sườn"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={addStop.isPending || !placeName || !lat || !lng}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold h-11"
          >
            {addStop.isPending ? "Đang thêm..." : "Thêm điểm dừng"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
