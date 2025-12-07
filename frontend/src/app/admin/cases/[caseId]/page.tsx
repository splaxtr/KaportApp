import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCaseDetail } from "@/lib/api/admin/cases";
import { CaseDetailClient } from "./components/case-detail-client";

type PageProps = {
  params: { caseId: string };
};

export default async function AdminCaseDetailPage(props: PageProps) {
  const { caseId } = await Promise.resolve(props.params);
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");

  const data = await getCaseDetail(caseId, token).catch(() => null);
  if (!data) {
    redirect("/admin/cases");
  }

  return (
    <CaseDetailClient
      initialData={data}
      caseId={caseId}
      token={token}
    />
  );
}
