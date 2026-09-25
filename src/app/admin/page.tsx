import AdminAccess from "@/components/admin/admin-access";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { getAdmin, hasAdmin } from "@/lib/admin-auth";
import { getAdminProducts } from "@/lib/admin-catalogue";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) {
    return <AdminAccess needsSetup={!(await hasAdmin())} setupConfigured={(process.env.ADMIN_SETUP_KEY?.length ?? 0) >= 24} />;
  }
  const products = await getAdminProducts();
  return <AdminDashboard user={admin} initialProducts={products} />;
}
