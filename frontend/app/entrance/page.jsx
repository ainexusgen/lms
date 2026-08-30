"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../../lib/api";

async function pub(path, opts) {
  const res = await fetch(`${API}/api${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export default function Entrance() {
  const [demo, setDemo] = useState(null);
  const [open, setOpen] = useState(false);
  const [denied, setDenied] = useState(false);
  const [last, setLast] = useState(null);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { pub("/rfid/demo/tags").then(setDemo).catch(() => {}); }, []);

  async function tap(card) {
    if (busy) return;
    setBusy(true); setLast(null); setDenied(false);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await pub("/rfid/entrance/scan", { method: "POST", body: JSON.stringify({ card_epc: card.card_epc, gate: "Lane 1" }) });
      setLast(res);
      setLog((l) => [{ ...res, name: res.member || card.full_name, at: new Date(), id: Math.random() }, ...l].slice(0, 8));
      if (res.open) {
        setOpen(true);
        setTimeout(() => setOpen(false), Number(res.open_ms) || 1200);
      } else {
        setDenied(true);
        setTimeout(() => setDenied(false), 1200);
      }
    } catch (e) {
      setLast({ open: false, reason: e.message });
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="font-extrabold">🚪 Entrance Flap Barrier <span className="text-slate-400 font-normal text-sm">— access control & attendance simulator</span></div>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← Exit</Link>
      </header>
      <div className="grid lg:grid-cols-[320px_1fr_300px] min-h-[calc(100vh-65px)]">
        <aside className="border-r border-white/10 p-4 overflow-y-auto">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Tap a member card</div>
          <div className="space-y-2">
            {demo?.cards?.map((c) => (
              <motion.button key={c.card_epc} whileTap={{ scale: 0.96 }} onClick={() => tap(c)}
                className={`w-full text-left rounded-lg p-3 border ${c.status === "active" ? "bg-brand-800/60 border-brand-500/40 hover:bg-brand-700/60" : "bg-rose-900/40 border-rose-500/40 hover:bg-rose-800/40"}`}>
                <div className="font-semibold text-sm">{c.full_name}</div>
                <div className="text-xs text-slate-300">{c.category} · {c.status}</div>
              </motion.button>
            ))}
          </div>
        </aside>

        <section className="grid place-items-center p-8">
          <div className="w-full max-w-md">
            <div className="relative h-72 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-white/10 overflow-hidden">
              {/* lane floor */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-slate-800/80 border-t border-white/10" />
              {/* pedestals */}
              <div className="absolute bottom-16 left-6 w-16 h-36 rounded-t-xl bg-slate-700 border border-white/10">
                <motion.div animate={busy ? { opacity: [0.3, 1, 0.3] } : {}} transition={{ repeat: Infinity, duration: 0.6 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-500/60 grid place-items-center text-sm">🪪</motion.div>
              </div>
              <div className="absolute bottom-16 right-6 w-16 h-36 rounded-t-xl bg-slate-700 border border-white/10" />
              {/* flaps */}
              <motion.div animate={{ rotateY: open ? 75 : 0, opacity: open ? 0.4 : 1 }} transition={{ type: "spring", stiffness: 150, damping: 16 }}
                style={{ transformOrigin: "left center" }}
                className={`absolute bottom-24 left-[88px] w-24 h-20 rounded-r-2xl ${denied ? "bg-rose-500/80" : "bg-brand-400/80"} backdrop-blur border border-white/30`} />
              <motion.div animate={{ rotateY: open ? -75 : 0, opacity: open ? 0.4 : 1 }} transition={{ type: "spring", stiffness: 150, damping: 16 }}
                style={{ transformOrigin: "right center" }}
                className={`absolute bottom-24 right-[88px] w-24 h-20 rounded-l-2xl ${denied ? "bg-rose-500/80" : "bg-brand-400/80"} backdrop-blur border border-white/30`} />
              {/* status lamp */}
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold ${open ? "bg-emerald-500" : denied ? "bg-rose-500" : "bg-slate-700 text-slate-300"}`}>
                {open ? "OPEN — welcome" : denied ? "ACCESS DENIED" : "READY"}
              </div>
              {/* walker */}
              <AnimatePresence>
                {open && (
                  <motion.div initial={{ left: "-15%" }} animate={{ left: "110%" }} exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                    className="absolute bottom-20 text-4xl">🚶</motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              {last && (
                <motion.div key={last.member || last.reason} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`mt-4 rounded-xl border p-4 text-center ${last.open ? "bg-emerald-900/40 border-emerald-500/40" : "bg-rose-900/40 border-rose-500/40"}`}>
                  {last.open
                    ? <><b>{last.member}</b> <span className="text-emerald-300">checked in</span> · attendance logged</>
                    : <><span className="text-rose-300 font-semibold">Denied:</span> {last.reason}{last.member ? ` (${last.member})` : ""}</>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <aside className="border-l border-white/10 p-4 overflow-y-auto">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Attendance log (this session)</div>
          <div className="space-y-1.5">
            {log.map((e) => (
              <div key={e.id} className={`rounded-lg px-3 py-2 text-xs border ${e.open ? "bg-white/5 border-white/10" : "bg-rose-900/30 border-rose-500/30"}`}>
                <b>{e.name}</b> — {e.open ? "entered" : `denied (${e.reason})`}
                <span className="text-slate-500"> · {e.at.toLocaleTimeString()}</span>
              </div>
            ))}
            {log.length === 0 && <div className="text-sm text-slate-500">Tap a card to see entries.</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
