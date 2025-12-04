"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

type Decoded = { role?: string; shopId?: string | null; sub?: string };

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readCookie("token");
    const roleCookie = readCookie("role");
    const shopCookie = readCookie("shopId");

    if (token) {
      try {
        const decoded = jwtDecode<Decoded>(token);
        setRole(roleCookie || decoded.role || null);
        setShopId(shopCookie || decoded.shopId || null);
        setUserId(decoded.sub || null);
      } catch {
        setRole(roleCookie || null);
        setShopId(shopCookie || null);
      }
    } else {
      setRole(roleCookie || null);
      setShopId(shopCookie || null);
    }
    setLoading(false);
  }, []);

  return {
    role,
    shopId,
    userId,
    isAdmin: role === "admin",
    isOwner: role === "owner",
    isEmployee: role === "employee",
    loading,
  };
}
