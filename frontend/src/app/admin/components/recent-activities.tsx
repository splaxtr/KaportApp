"use client";

import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityItem } from "@/components/dashboard/ActivityItem";

type Activity = { id: string; message: string; createdAt: string; user?: string };

export function RecentActivities({ activities }: { activities: Activity[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 && <p className="text-sm text-muted-foreground">Son aktivite bulunamadı</p>}
          {activities.map((a) => (
            <ActivityItem
              key={a.id}
              message={a.message}
              timestamp={a.createdAt}
              icon={Clock3}
              badge={a.user ? a.user : undefined}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
