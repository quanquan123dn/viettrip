"use client";

import { useState } from "react";
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
            Nhập thông tin địa điểm hoặc chọn nhanh
          </DialogDescription>
        </DialogHeader>

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
                  setLat(p.lat.toString());
                  setLng(p.lng.toString());
                }}
                className="text-xs px-2.5 py-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 border border-zinc-700 transition-all"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-zinc-300">Tên địa điểm *</Label>
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
            disabled={addStop.isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold h-11"
          >
            {addStop.isPending ? "Đang thêm..." : "Thêm điểm dừng"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
