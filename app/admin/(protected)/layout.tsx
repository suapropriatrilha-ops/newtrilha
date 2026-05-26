import { requireAuth } from "@/lib/auth";
import Sidebar from "./sidebar";
import "../admin.css";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="spt">
      <div className="spt-shell">
        <Sidebar />
        <main className="spt-main">{children}</main>
      </div>
    </div>
  );
}
