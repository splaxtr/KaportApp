import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { CreateUserDialog } from "./components/create-user-dialog";
import { UsersTable } from "./components/users-table";
import { getUsers, UserRow } from "@/lib/api/users";

type Decoded = { role?: string };

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const users = await getUsers(token);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground">Kullanıcıları, rolleri ve atamalarını yönetin.</p>
        </div>
        <CreateUserDialog token={token} />
      </div>

      <UsersTable data={users as UserRow[]} token={token} />
    </div>
  );
}
