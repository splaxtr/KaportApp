import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getUsers } from "@/lib/api/users";
import { EmployeesTable } from "../../owner/employees/components/employees-table";

type Decoded = { role?: string; shopId?: string };

export default async function EmployeeEmployeesPage() {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role === "admin" || decoded.role === "owner" || decoded.role === "employee") {
    const users = await getUsers(token);
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Çalışanlar</h1>
          <p className="text-sm text-muted-foreground">Şubenizdeki çalışanları görüntüleyin.</p>
        </div>
        <EmployeesTable data={users} token={token} shopId={decoded.shopId} />
      </div>
    );
  }
  redirect("/not-authorized");
}
