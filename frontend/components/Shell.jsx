"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearSession } from "../lib/api";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/catalog", label: "Catalog", icon: "📚" },
  { href: "/members", label: "Members", icon: "🪪" },
  { href: "/circulation", label: "Circulation", icon: "🔁" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

const SIMS = [
  { href: "/kiosk", label: "Self-Issue Kiosk", icon: "🖥️" },
  { href: "/bookdrop", label: "Book Drop", icon: "📮" },
  { href: "/gate", label: "Security Gate", icon: "🚨" },
  { href: "/entrance", label: "Entrance Barrier", icon: "🚪" },
  { href: "/opac", label: "Public OPAC", icon: "🔎" },
];

export default function Shell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
  }, [router]);

  if (!user) return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-brand-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-lg font-extrabold tracking-tight">TechNexus<span className="text-brand-300">Gen</span></div>
          <div className="text-[10px] uppercase tracking-widest text-brand-300 mt-0.5">RFID Library System</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith(n.href) ? "bg-brand-600 text-white" : "text-brand-100 hover:bg-white/10"}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
          <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-widest text-brand-400">RFID Simulators</div>
          {SIMS.map((n) => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith(n.href) ? "bg-brand-600 text-white" : "text-brand-100 hover:bg-white/10"}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-sm">
          <div className="font-semibold">{user.name}</div>
          <div className="text-brand-300 text-xs capitalize">{user.role}</div>
          <button onClick={() => { clearSession(); router.push("/login"); }}
            className="mt-2 text-xs text-brand-200 hover:text-white underline">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  );
}
