"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "./actions";

const links = [
  { href: "/admin", label: "Visão geral", icon: "◴" },
  { href: "/admin/ebooks", label: "Ebooks", icon: "❖" },
  { href: "/admin/compras", label: "Compras", icon: "₪" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="spt-sidebar">
      <div className="spt-brand">
        Sua Própria<br />Trilha
        <small>Admin</small>
      </div>
      <nav className="spt-nav">
        {links.map((l) => {
          const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? "active" : ""}>
              <span aria-hidden style={{ width: 16, textAlign: "center" }}>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="spt-sidebar-foot">
        <form action={signOutAction}>
          <button type="submit" className="spt-signout">Sair</button>
        </form>
      </div>
    </aside>
  );
}
