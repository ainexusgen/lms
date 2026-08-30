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

export default function BookDrop() {
  const [demo, setDemo] = useState(null);
  const [dropping, setDropping] = useState(null);   // book currently falling
  const [receipts, setReceipts] = useState([]);
  const loadDemo = () => pub("/rfid/demo/tags").then(setDemo).catch(() => {});
  useEffect(() => { loadDemo(); }, []);

  async function drop(b) {
    if (dropping) return;
    setDropping(b);
    await new Promise((r) => setTimeout(r, 1100)); // fall animation
    try {
      const res = await pub("/rfid/bookdrop/return", { method: "POST", body: JSON.stringify({ tag_epc: b.tag_epc }) });
      setReceipts((rs) => [{ ...res, at: new Date(), id: Math.random() }, ...rs].slice(0, 6));
    } catch (e) {
      setReceipts((rs) => [{ title: b.title, error: e.message, at: new Date(), id: Math.random() }, ...rs].slice(0, 6));
    }
    setDropping(null); loadDemo();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="font-extrabold">📮 UHF Book Drop <span className="text-slate-400 font-normal text-sm">— 24×7 self return simulator</span></div>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← Exit</Link>
      </header>
      <div className="grid lg:grid-cols-[320px_1fr_320px] min-h-[calc(100vh-65px)]">
        <aside className="border-r border-white/10 p-4 overflow-y-auto">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Books on loan — drop one in</div>
          <div className="space-y-2">
            {demo?.on_loan?.length === 0 && <div className="text-sm text-slate-500">No books on loan. Issue some at the kiosk first.</div>}
            {demo?.on_loan?.map((b) => (
              <motion.button key={b.tag_epc} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                onClick={() => drop(b)} disabled={!!dropping}
                className="w-full text-left rounded-lg p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 flex items-center gap-2">
                <div className="w-2 h-8 rounded-sm shrink-0" style={{ background: b.cover_color }} />
                <div>
                  <div className="font-medium text-xs leading-tight">{b.title}</div>
                  <div className="text-[10px] text-slate-400">borrowed by {b.borrower}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </aside>

        <section className="grid place-items-center p-8">
          <div className="relative w-72">
            {/* the drop box */}
            <div className="relative rounded-2xl bg-gradient-to-b from-brand-700 to-brand-900 border border-brand-500/40 p-6 pt-4 shadow-2xl">
              <div className="text-center text-xs uppercase tracking-widest text-brand-200 mb-3">Book Return</div>
              <div className="relative h-8 rounded-lg bg-slate-950 border border-white/20 overflow-hidden">
                <AnimatePresence>
                  {dropping && (
                    <motion.div key={dropping.tag_epc}
                      initial={{ y: -60, opacity: 1 }} animate={{ y: 60 }} exit={{ opacity: 0 }}
                      transition={{ duration: 1.0, ease: "easeIn" }}
                      className="absolute left-1/2 -translate-x-1/2 w-20 h-6 rounded-sm"
                      style={{ background: dropping.cover_color }} />
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-4 h-20 rounded-lg bg-slate-950/60 border border-white/10 grid place-items-center relative overflow-hidden">
                {dropping
                  ? <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8 }}
                      className="text-brand-300 text-sm font-semibold">📡 Reading UHF tag…</motion.div>
                  : <div className="text-slate-500 text-sm">Antenna idle</div>}
              </div>
              <div className="mt-3 text-center text-[10px] text-slate-400">Auto check-in · security re-armed · fine auto-calculated</div>
            </div>
          </div>
        </section>

        <aside className="border-l border-white/10 p-4 overflow-y-auto">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Return receipts</div>
          <div className="space-y-2">
            <AnimatePresence>
              {receipts.map((r) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  className={`rounded-lg p-3 border text-sm ${r.error ? "bg-rose-900/40 border-rose-500/40" : "bg-emerald-900/30 border-emerald-500/30"}`}>
                  <div className="font-semibold">{r.title}</div>
                  {r.error ? <div className="text-rose-300 text-xs">{r.error}</div> : (
                    <>
                      {r.member && <div className="text-xs text-slate-300">returned by {r.member}</div>}
                      {r.fine > 0
                        ? <div className="text-xs text-amber-300 font-semibold">Overdue fine: ₹{r.fine.toFixed(2)}</div>
                        : <div className="text-xs text-emerald-300">On time — no fine</div>}
                      {r.reservation_ready_for && <div className="text-xs text-brand-300">🔖 Held for {r.reservation_ready_for}</div>}
                      <div className="text-[10px] text-slate-400 mt-1">🔒 Security bit re-armed</div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {receipts.length === 0 && <div className="text-sm text-slate-500">Drop a book to see the check-in receipt.</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
