"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const MODULES = [
  { href: "/kiosk", icon: "🖥️", title: "Self-Issue Kiosk", desc: "Tap a member card, place books on the pad, watch UHF read the whole stack at once." },
  { href: "/bookdrop", icon: "📮", title: "Book Drop Return", desc: "24×7 returns — the drop box checks books in and re-arms security automatically." },
  { href: "/gate", icon: "🚨", title: "Security Gate", desc: "Walk books through the corridor. Un-issued items trigger the alarm instantly." },
  { href: "/entrance", icon: "🚪", title: "Entrance Barrier", desc: "Flap barriers read member cards at range and log footfall automatically." },
  { href: "/opac", icon: "🔎", title: "Public OPAC", desc: "Members search the catalogue, see live availability and shelf locations." },
  { href: "/dashboard", icon: "📊", title: "Staff Console", desc: "Dashboard, catalog, members, circulation, fines, reports & configuration." },
];

const FLOW = ["Member card read", "Books stacked & read", "Loan approved", "Security disarmed", "Silent exit"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white overflow-hidden">
      {/* animated rings */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div key={i}
            className="absolute rounded-full border border-white/10"
            style={{ width: 500 + i * 260, height: 500 + i * 260, right: -180 - i * 90, top: -140 - i * 70 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 60 + i * 30, repeat: Infinity, ease: "linear" }}>
            <div className="absolute w-3 h-3 rounded-full bg-brand-300 left-1/2 -top-1.5" />
          </motion.div>
        ))}
      </div>

      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div>
          <div className="text-xl font-extrabold tracking-tight">TechNexus<span className="text-brand-300">Gen</span></div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-brand-200">Build · Automate · Scale</div>
        </div>
        <Link href="/login" className="btn bg-white text-brand-800 hover:bg-brand-50">Staff Login</Link>
      </header>

      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-14 pb-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-xs uppercase tracking-[0.3em] text-brand-200 mb-4">Live Product Demo</div>
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
            UHF RFID<br />Library Management<br /><span className="text-brand-300">System</span>
          </h1>
          <p className="mt-6 max-w-xl text-brand-100 text-lg">
            Self-service circulation, anti-theft gates, entrance access control and a full
            web LMS — every business scenario from our proposal, running live with test data.
          </p>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href="/kiosk" className="btn bg-brand-300 text-brand-900 hover:bg-brand-200 text-base px-6 py-3">▶ Start the Kiosk Demo</Link>
            <Link href="/dashboard" className="btn border border-white/40 hover:bg-white/10 text-base px-6 py-3">Open Staff Console</Link>
          </div>
        </motion.div>

        {/* animated flow strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-14 flex items-center gap-2 flex-wrap">
          {FLOW.map((f, i) => (
            <div key={f} className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.06, 1], backgroundColor: ["rgba(255,255,255,0.08)", "rgba(147,197,253,0.25)", "rgba(255,255,255,0.08)"] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium">
                {f}
              </motion.div>
              {i < FLOW.length - 1 && <span className="text-brand-300">→</span>}
            </div>
          ))}
        </motion.div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m, i) => (
          <motion.div key={m.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}>
            <Link href={m.href}
              className="block h-full rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-5 hover:bg-white/20 hover:-translate-y-1 transition-all">
              <div className="text-3xl">{m.icon}</div>
              <div className="mt-3 font-bold text-lg">{m.title}</div>
              <div className="mt-1 text-sm text-brand-100">{m.desc}</div>
            </Link>
          </motion.div>
        ))}
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="font-extrabold">TechNexus<span className="text-brand-300">Gen</span></div>
            <div className="text-xs text-brand-200 mt-0.5">UHF RFID Library Management System · demo build</div>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center text-sm">
            <a href="mailto:support@technexusgen.com" className="text-brand-100 hover:text-white flex items-center gap-1.5">
              <span>✉️</span> support@technexusgen.com
            </a>
            <a href="tel:+917411267589" className="text-brand-100 hover:text-white flex items-center gap-1.5">
              <span>📞</span> +91 74112 67589
            </a>
            <a href="https://technexusgen.com/" target="_blank" rel="noopener noreferrer" className="text-brand-100 hover:text-white flex items-center gap-1.5">
              <span>🌐</span> technexusgen.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
