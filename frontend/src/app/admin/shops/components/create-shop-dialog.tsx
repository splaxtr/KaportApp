"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createShop, getUsers, UserOption, CreateShopDto } from "@/lib/api/shops";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
};

export function CreateShopDialog({ token }: Props) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [status, setStatus] = useState<"active" | "passive">("active");
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    getUsers(token).then(setUsers).catch(() => setUsers([]));
  }, [open, token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: CreateShopDto = { name, ownerId, status };
      await createShop(payload, token);
      setOpen(false);
      setName("");
      setOwnerId("");
      setStatus("active");
      router.refresh();
    } catch {
      // silently ignore or integrate toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Shop
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Create Shop</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Shop Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Owner</label>
            <Select value={ownerId} onValueChange={(v) => setOwnerId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "passive")}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="passive">Passive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
