"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserRow } from "@/lib/api/users";
import { UserRoles } from "./user-roles";
import { cn } from "@/lib/utils";
import { Clock, Mail, ShieldCheck, Store, User } from "lucide-react";

export function UserDetailTabs({
  user,
  activity,
  shops,
  token,
}: {
  user: UserRow;
  activity: { id: string; message: string; createdAt: string }[];
  shops: { id: string; name: string }[];
  token: string;
}) {
  const info = [
    { label: "E-posta", value: user.email, icon: Mail },
    { label: "Rol", value: user.role, icon: ShieldCheck },
    { label: "Şube", value: user.shop?.name || "-", icon: Store },
    { label: "Durum", value: user.status === "passive" ? "Pasif" : "Aktif", icon: User },
    { label: "Oluşturulma", value: user.createdAt ? new Date(user.createdAt).toLocaleString("tr-TR") : "-", icon: Clock },
    { label: "Son giriş", value: user.lastLogin ? new Date(user.lastLogin).toLocaleString("tr-TR") : "-", icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{user.name || user.email}</h1>
        <p className="text-sm text-muted-foreground">Rol, atama ve aktiviteleri yönetin.</p>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="roles">Roller</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Genel Bakış</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {info.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                  <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</div>
                    <div className="text-sm text-foreground">{item.value}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <UserRoles user={user} shops={shops} token={token} />
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 pr-2">
                <div className="space-y-3">
                  {activity && activity.length > 0 ? (
                    activity.map((act) => (
                      <div key={act.id} className="flex flex-col rounded-lg border border-border/70 bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-foreground">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="text-sm">{act.message}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(act.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Aktivite yok.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
