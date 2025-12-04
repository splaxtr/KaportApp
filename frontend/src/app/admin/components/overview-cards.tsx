"use client";

import { motion } from "framer-motion";
import { StatCard } from "@/components/dashboard/StatCard";
import { Activity, Building2, Car, Wrench } from "lucide-react";

type Props = {
  shops: number;
  users: number;
  vehicles: number;
  partsPending: number;
  last24hActions: number;
};

const icons = {
  shops: Building2,
  users: Activity,
  vehicles: Car,
  parts: Wrench,
  actions: Activity,
};

export function OverviewCards({ shops, users, vehicles, partsPending, last24hActions }: Props) {
  const data = [
    { title: "Toplam Şube", value: String(shops), icon: icons.shops, accentClass: "text-blue-300" },
    { title: "Aktif Kullanıcı", value: String(users), icon: icons.users, accentClass: "text-emerald-300" },
    { title: "Sistemdeki Araç", value: String(vehicles), icon: icons.vehicles, accentClass: "text-purple-300" },
    { title: "Bekleyen Parça", value: String(partsPending), icon: icons.parts, accentClass: "text-amber-300" },
    { title: "Aksiyonlar (24s)", value: String(last24hActions), icon: icons.actions, accentClass: "text-teal-300" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {data.map((item, idx) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <StatCard
            title={item.title}
            value={item.value}
            icon={item.icon}
            accentClass={item.accentClass}
            updatedAt="Güncel"
            trend={undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}
