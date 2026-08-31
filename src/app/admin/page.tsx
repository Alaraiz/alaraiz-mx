import { redirect } from "next/navigation";
import { adminEmail } from "@/lib/auth";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await adminEmail())) redirect("/admin/login");
  return <AdminDashboard />;
}
