import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getShopEmployees } from "@/lib/api/shops";
import { EmployeesTable } from "./components/employees-table";

type Decoded = { role?: string; shopId?: string };

export default async function OwnerEmployeesPage() {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role === "admin" || decoded.role === "owner" || decoded.role === "employee") {
    const users = decoded.shopId ? await getShopEmployees(decoded.shopId, token) : [];
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Çalışanlar</h1>
          <p className="text-sm text-muted-foreground">Şubenizdeki çalışanları yönetin.</p>
        </div>
        <EmployeesTable data={users} token={token} shopId={decoded.shopId} />
      </div>
    );
  }
  redirect("/not-authorized");
}
