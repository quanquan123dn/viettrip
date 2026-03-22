"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
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

  // Places Autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [placeSelected, setPlaceSelected] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasGoogleMaps = apiKey && apiKey !== "YOUR_BROWSER_API_KEY_HERE";

  // Load Google Maps script if not already loaded
  useEffect(() => {
    if (!hasGoogleMaps || typeof google !== "undefined") return;

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  }, [apiKey, hasGoogleMaps]);

  // Initialize services when Google Maps is ready
  useEffect(() => {
    if (!hasGoogleMaps || !isAddStopOpen) return;

    const init = () => {
      if (typeof google !== "undefined" && google.maps?.places) {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        if (!dummyDiv.current) {
          dummyDiv.current = document.createElement("div");
        }
        placesService.current = new google.maps.places.PlacesService(dummyDiv.current);
      }
    };

    // Try immediately, or wait for script
    init();
    if (!autocompleteService.current) {
      const interval = setInterval(() => {
        init();
        if (autocompleteService.current) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [hasGoogleMaps, isAddStopOpen]);

  const searchPlaces = useCallback((query: string) => {
    if (!autocompleteService.current || !query.trim()) {
      setPredictions([]);
      return;
    }

    setIsSearching(true);
    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "vn" },
        types: ["establishment", "geocode"],
      },
      (results, status) => {
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(
            results.map((r) => ({
              placeId: r.place_id,
              mainText: r.structured_formatting.main_text,
              secondaryText: r.structured_formatting.secondary_text || "",
            }))
          );
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPlaceSelected(false);
    setShowPredictions(true);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPlaces(value), 300);
  };

  // Select a place from predictions
  const selectPlace = (prediction: PlacePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.placeId,
        fields: ["name", "formatted_address", "geometry"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          setPlaceName(place.name || prediction.mainText);
          setAddress(place.formatted_address || prediction.secondaryText);
          setLat(place.geometry?.location?.lat()?.toString() || "");
          setLng(place.geometry?.location?.lng()?.toString() || "");
          setSearchQuery(place.name || prediction.mainText);
          setPlaceSelected(true);
          setShowPredictions(false);
          setPredictions([]);
        }
      }
    );
  };

  const queryClient = useQueryClient();

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
    setPredictions([]);
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
            {hasGoogleMaps
              ? "Tìm kiếm địa điểm hoặc chọn nhanh bên dưới"
              : "Nhập thông tin địa điểm hoặc chọn nhanh"}
          </DialogDescription>
        </DialogHeader>

        {/* Google Places Search */}
        {hasGoogleMaps && (
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
                  if (predictions.length > 0 && !placeSelected) setShowPredictions(true);
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

            {/* Predictions dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => selectPlace(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-700/50 transition-colors border-b border-zinc-700/50 last:border-0"
                  >
                    <div className="text-sm text-white font-medium">
                      {p.mainText}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {p.secondaryText}
                    </div>
                  </button>
                ))}
                <div className="px-3 py-1.5 text-[10px] text-zinc-600 bg-zinc-800/50 flex items-center gap-1">
                  Powered by Google Maps
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick place picker */}
        <div className="mt-2">
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
                  setShowPredictions(false);
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
                <span className="text-emerald-400 text-xs ml-2">✓ từ Google Maps</span>
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

          {/* Lat/Lng — hidden when auto-filled, shown for manual */}
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

          {/* Show coordinates as read-only when selected from search */}
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
