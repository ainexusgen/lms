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

export default function Gate() {
  const [demo, setDemo] = useState(null);
  const [carrying, setCarrying] = useState([]);
  const [phase, setPhase] = useState("idle");   // idle | walking | result
  const [result, setResult] = useState(null);

  const loadDemo = () => pub("/rfid/demo/tags").then(setDemo).catch(() => {});
  useEffect(() => { loadDemo(); }, []);

  function toggle(b) {
    setCarrying((c) => c.find((x) => x.tag_epc === b.tag_epc)
      ? c.filter((x) => x.tag_epc !== b.tag_epc) : [...c, b].slice(0, 4));
  }

  async function walk() {
    if (carrying.length === 0 || phase === "walking") return;
    setPhase("walking"); setResult(null);
    await new Promise((r) => setTimeout(r, 1400));
    try {
      const res = await pub("/rfid/gate/scan", { method: "POST", body: JSON.stringify({ tag_epcs: carrying.map((b) => b.tag_epc) }) });
      setResult(res); setPhase("result");
    } catch (e) { setResult({ alarm: false, error: e.message }); setPhase("result"); }
  }

  function reset() { setPhase("idle"); setResult(null); setCarrying([]); loadDemo(); }
  const alarm = phase === "result" && result?.alarm;

  return (
    <div className={`min-h-screen text-white transition-colors duration-300 ${alarm ? "bg-rose-950" : "bg-slate-900"}`}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="font-extrabold">🚨 RFID Security Gate <span className="text-slate-400 font-normal text-sm">— anti-theft corridor simulator</span></div>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← Exit</Link>
      </header>

      <div className="grid lg:grid-cols-[340px_1fr] min-h-[calc(100vh-65px)]">
        <aside className="border-r border-white/10 p-4 overflow-y-auto">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Pick books to carry out</div>
          <p className="text-[11px] text-slate-400 mb-3">🔓 issued books pass silently · 🔒 un-issued books trigger the alarm</p>
          <div className="text-[11px] font-bold text-emerald-400 mb-1">ISSUED (disarmed)</div>
          <div className="space-y-1.5 mb-4">
            {demo?.on_loan?.slice(0, 4).map((b) => (
              <button key={b.tag_epc} onClick={() => toggle(b)}
                className={`w-full text-left rounded-lg p-2 border text-xs flex items-center gap-2 ${carrying.find((x) => x.tag_epc === b.tag_epc) ? "bg-brand-600 border-brand-400" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                <span>🔓</span><span className="flex-1">{b.title}</span>
              </button>
            ))}
          </div>
          <div className="text-[11px] font-bold text-rose-400 mb-1">NOT ISSUED (armed)</div>
          <div className="space-y-1.5">
            {demo?.available?.slice(0, 4).map((b) => (
              <button key={b.tag_epc} onClick={() => toggle(b)}
                className={`w-full text-left rounded-lg p-2 border text-xs flex items-center gap-2 ${carrying.find((x) => x.tag_epc === b.tag_epc) ? "bg-rose-600 border-rose-400" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                <span>🔒</span><span className="flex-1">{b.title}</span>
              </button>
            ))}
          </div>
          <button onClick={walk} disabled={carrying.length === 0 || phase === "walking"}
            className="btn-primary w-full mt-5 py-3">🚶 Walk through the gate ({carrying.length})</button>
          {phase === "result" && <button onClick={reset} className="btn border border-white/30 hover:bg-white/10 w-full mt-2">Reset</button>}
        </aside>

        <section className="relative grid place-items-center p-8 overflow-hidden">
          {/* corridor */}
          <div className="relative w-full max-w-xl h-80">
            {/* gate panels */}
            {[0, 1].map((side) => (
              <motion.div key={side}
                animate={alarm ? { boxShadow: ["0 0 0px #f43f5e", "0 0 40px #f43f5e", "0 0 0px #f43f5e"] } : {}}
                transition={{ repeat: alarm ? Infinity : 0, duration: 0.5 }}
                className={`absolute top-0 bottom-0 w-16 rounded-xl border ${side === 0 ? "left-8" : "right-8"} ${alarm ? "bg-rose-800 border-rose-400" : "bg-brand-900 border-brand-500/40"}`}>
                <div className="absolute inset-x-3 top-4 bottom-4 rounded-lg border border-white/10 overflow-hidden">
                  <div className={`absolute inset-x-0 h-10 ${alarm ? "bg-rose-400/40" : "bg-brand-400/30"} animate-scanline`} />
                </div>
                <motion.div
                  animate={alarm ? { backgroundColor: ["#f43f5e", "#7f1d1d", "#f43f5e"] } : { backgroundColor: "#10b981" }}
                  transition={{ repeat: alarm ? Infinity : 0, duration: 0.4 }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full" />
              </motion.div>
            ))}

            {/* walker */}
            <AnimatePresence>
              {phase === "walking" && (
                <motion.div key="walker"
                  initial={{ left: "-10%" }} animate={{ left: "105%" }} exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: "linear" }}
                  className="absolute top-1/2 -translate-y-1/2 text-5xl">
                  🚶
                  <div className="flex gap-0.5 mt-1">
                    {carrying.map((b) => (
                      <div key={b.tag_epc} className="w-3 h-5 rounded-sm" style={{ background: b.cover_color }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "idle" && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-slate-500 text-sm">
                Select books, then walk through the corridor
              </div>
            )}

            {/* result banner */}
            <AnimatePresence>
              {phase === "result" && result && (
                <motion.div key="res" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-x-0 -bottom-4 translate-y-full">
                  <div className={`mx-auto max-w-md rounded-xl border p-4 text-center ${result.alarm ? "bg-rose-900/70 border-rose-500" : "bg-emerald-900/50 border-emerald-500/50"}`}>
                    <div className="text-2xl font-extrabold">
                      {result.alarm ? "🔴 ALARM — un-issued item detected" : "🟢 Clear — walk through"}
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {result.tags?.map((t) => (
                        <div key={t.tag_epc} className={t.alarm ? "text-rose-300 font-semibold" : "text-emerald-300"}>
                          {t.alarm ? "🔒" : "🔓"} {t.title}
                        </div>
                      ))}
                    </div>
                    {result.alarm && <div className="mt-2 text-xs text-rose-200">Event logged · staff notified on the dashboard</div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
