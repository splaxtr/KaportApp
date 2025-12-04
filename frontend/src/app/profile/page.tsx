import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMe } from "@/lib/api/users";
import { ProfileForm } from "./profile-form";

type Decoded = { sub?: string; role?: string };

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (!decoded.sub) redirect("/login");

  const me = await getMe(decoded.sub, token).catch(() => null);
  if (!me) redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil</h1>
        <p className="text-sm text-muted-foreground">Bilgilerinizi güncelleyebilirsiniz.</p>
      </div>
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm user={me} token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
