import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getCustomers } from "@/lib/api/customers";
import { CustomersTable } from "./components/customers-table";

type Decoded = { role?: string };

export default async function OwnerCustomersPage() {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role === "employee" || decoded.role === "owner" || decoded.role === "admin") {
    const customers = await getCustomers(token);
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Müşteriler</h1>
          <p className="text-sm text-muted-foreground">Müşteri listesi ve ekleme/düzenleme işlemleri.</p>
        </div>
        <CustomersTable data={customers} token={token} />
      </div>
    );
  }
  redirect("/not-authorized");
}
