import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getUserActivity, getUserDetail } from "@/lib/api/users";
import { UserDetailTabs } from "./components/user-detail";
import { getShops } from "@/lib/api/shops";

type Decoded = { role?: string };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const [user, activity, shops] = await Promise.all([
    getUserDetail(id, token).catch(() => null),
    getUserActivity(id, token),
    getShops(token),
  ]);

  if (!user) redirect("/admin/users");

  return <UserDetailTabs user={user} activity={activity} shops={shops} token={token} />;
}
