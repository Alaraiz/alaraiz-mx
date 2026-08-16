import { redirect } from "next/navigation";
import { adminEmail } from "@/lib/auth";
import AdminDashboard from "./dashboard";

export default async function AdminPage() {
  if (!(await adminEmail())) redirect("/admin/login");
  return <AdminDashboard />;
}
