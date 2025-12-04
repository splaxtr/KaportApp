import { Activity, Car, Image as ImageIcon, Settings, Wrench, Users } from "lucide-react";

export const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: Activity, description: "Overview & insights" },
  { title: "Vehicles", href: "/vehicles", icon: Car, description: "Manage vehicles" },
  { title: "Parts", href: "/parts", icon: Wrench, description: "Track parts" },
  { title: "Customers", href: "/customers", icon: Users, description: "Customer files & history" },
  { title: "Photos", href: "/photos", icon: ImageIcon, description: "Upload & review" },
  { title: "Settings", href: "/settings", icon: Settings, description: "Configuration" }
];
