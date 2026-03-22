"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ShareDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ tripId, open, onOpenChange }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: links, isLoading: linksLoading } = useQuery({
    queryKey: ["share-links", tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/share`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
  });

  const createLink = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission: "view" }),
      });
      if (!res.ok) throw new Error("Failed to create share link");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-links", tripId] });
      toast.success("Tạo link chia sẻ thành công!");
    },
  });

  const getShareUrl = (token: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${token}`;

  const handleCopy = async (token: string) => {
    const url = getShareUrl(token);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Đã copy link!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            🔗 Chia sẻ chuyến đi
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Tạo link để chia sẻ lịch trình với bạn bè
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Button
            onClick={() => createLink.mutate()}
            disabled={createLink.isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold h-11"
          >
            {createLink.isPending ? "Đang tạo..." : "✨ Tạo link mới"}
          </Button>

          {/* Existing links */}
          {linksLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : links?.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Links đã tạo
              </p>
              {links.map(
                (link: {
                  id: string;
                  token: string;
                  permission: string;
                  expiresAt: string | null;
                  createdAt: string;
                }) => {
                  const isExpired =
                    link.expiresAt && new Date(link.expiresAt) < new Date();
                  return (
                    <div
                      key={link.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isExpired
                          ? "bg-zinc-900/50 border-zinc-800 opacity-50"
                          : "bg-zinc-800/50 border-zinc-700"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <Input
                          readOnly
                          value={getShareUrl(link.token)}
                          className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs h-8"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500">
                            {link.permission === "edit" ? "✏️ Chỉnh sửa" : "👁️ Xem"}
                          </span>
                          {isExpired && (
                            <span className="text-xs text-red-400">Đã hết hạn</span>
                          )}
                        </div>
                      </div>
                      {!isExpired && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(link.token)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-700 h-8 px-3 text-xs flex-shrink-0"
                        >
                          {copied ? "✓" : "📋"}
                        </Button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-4">
              Chưa có link nào. Tạo link mới để chia sẻ!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
