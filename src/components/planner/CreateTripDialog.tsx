"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TRIP_STYLES = [
  { value: "CHILL", label: "🏖️ Chill", color: "from-blue-400 to-cyan-300" },
  { value: "EXPLORE", label: "🧭 Khám phá", color: "from-orange-400 to-amber-300" },
  { value: "FOOD", label: "🍜 Ẩm thực", color: "from-red-400 to-pink-300" },
  { value: "NATURE", label: "🌿 Thiên nhiên", color: "from-green-400 to-emerald-300" },
  { value: "SPIRITUAL", label: "🛕 Tâm linh", color: "from-purple-400 to-violet-300" },
];

const TRAVEL_MODES = [
  { value: "DRIVE", label: "🚗 Ô tô" },
  { value: "MOTORBIKE", label: "🏍️ Xe máy" },
];

export function CreateTripDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelMode, setTravelMode] = useState("DRIVE");
  const [tripStyle, setTripStyle] = useState("EXPLORE");

  const queryClient = useQueryClient();

  const createTrip = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create trip");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setOpen(false);
      resetForm();
      toast.success("Tạo chuyến đi thành công!");
      if (data?.id) router.push(`/trips/${data.id}`);
    },
    onError: () => {
      toast.error("Không thể tạo chuyến đi");
    },
  });

  function resetForm() {
    setTitle("");
    setStartDate("");
    setEndDate("");
    setTravelMode("DRIVE");
    setTripStyle("EXPLORE");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createTrip.mutate({
      title,
      startDate,
      endDate,
      travelMode,
      tripStyle,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-105"
          />
        }
      >
        <span className="mr-2 text-lg">✈️</span>
        Tạo chuyến đi mới
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            ✈️ Tạo chuyến đi mới
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Điền thông tin để bắt đầu lên lịch chuyến đi
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Tên chuyến đi</Label>
            <Input
              placeholder="VD: Phú Quốc 3 ngày 2 đêm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Ngày bắt đầu</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Ngày kết thúc</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate}
                className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Phương tiện</Label>
            <Select value={travelMode} onValueChange={(v) => v && setTravelMode(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {TRAVEL_MODES.map((mode) => (
                  <SelectItem
                    key={mode.value}
                    value={mode.value}
                    className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                  >
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Phong cách</Label>
            <Select value={tripStyle} onValueChange={(v) => v && setTripStyle(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {TRIP_STYLES.map((style) => (
                  <SelectItem
                    key={style.value}
                    value={style.value}
                    className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                  >
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={createTrip.isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold h-11"
          >
            {createTrip.isPending ? "Đang tạo..." : "Tạo chuyến đi"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
