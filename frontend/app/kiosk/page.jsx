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

export default function Kiosk() {
  const [demo, setDemo] = useState(null);          // cards + available books
  const [step, setStep] = useState("idle");        // idle | reading | member | scanning | done | error
  const [member, setMember] = useState(null);
  const [pad, setPad] = useState([]);              // books placed on pad
  const [readEpcs, setReadEpcs] = useState([]);    // animated read progress
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const loadDemo = () => pub("/rfid/demo/tags").then(setDemo).catch((e) => setError(e.message));
  useEffect(() => { loadDemo(); }, []);

  async function tapCard(card) {
    setStep("reading"); setError(""); setResult(null); setPad([]); setReadEpcs([]);
    await new Promise((r) => setTimeout(r, 900));   // RF read animation
    try {
      const info = await pub(`/rfid/kiosk/card/${card.card_epc}`);
      setMember({ ...info.member, card_epc: card.card_epc, kiosk_max: info.kiosk_max_books, current: info.loans });
      setStep("member");
    } catch (e) { setError(e.message); setStep("error"); }
  }

  function placeBook(b) {
    if (pad.find((x) => x.tag_epc === b.tag_epc)) return;
    if (member && pad.length >= member.kiosk_max) return;
    setPad((p) => [...p, b]);
  }

  async function checkout() {
    setStep("scanning"); setReadEpcs([]);
    for (let i = 0; i < pad.length; i++) {
      await new Promise((r) => setTimeout(r, 450));
      setReadEpcs((e) => [...e, pad[i].tag_epc]);
    }
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await pub("/rfid/kiosk/checkout", {
        method: "POST",
        body: JSON.stringify({ card_epc: member.card_epc, tag_epcs: pad.map((b) => b.tag_epc) }),
      });
      setResult(res); setStep("done"); loadDemo();
    } catch (e) { setError(e.message); setStep("error"); }
  }

  function reset() { setStep("idle"); setMember(null); setPad([]); setResult(null); setError(""); }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <div className="font-extrabold">🖥️ UHF Self-Issue Kiosk <span className="text-slate-400 font-normal text-sm">— simulator</span></div>
        </div>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← Exit kiosk</Link>
      </header>

      <div className="flex-1 grid lg:grid-cols-[320px_1fr] gap-0">
        {/* Demo drawer: cards & books to interact with */}
        <aside className="border-r border-white/10 p-4 overflow-y-auto">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Member cards — tap one</div>
          <div className="space-y-2 mb-6">
            {demo?.cards?.slice(0, 6).map((c) => (
              <motion.button key={c.card_epc} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => tapCard(c)}
                className={`w-full text-left rounded-lg p-3 border ${c.status === "active" ? "bg-brand-800/60 border-brand-500/40 hover:bg-brand-700/60" : "bg-rose-900/40 border-rose-500/40"}`}>
                <div className="font-semibold text-sm">{c.full_name}</div>
                <div className="text-[10px] font-mono text-slate-400">{c.card_epc}</div>
                <div className="text-xs text-slate-300">{c.category} · {c.status}</div>
              </motion.button>
            ))}
          </div>
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Books on shelf — place on pad</div>
          <div className="space-y-2">
            {demo?.available?.map((b) => (
              <motion.button key={b.tag_epc} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => placeBook(b)} disabled={step !== "member"}
                className="w-full text-left rounded-lg p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 flex items-center gap-2">
                <div className="w-2 h-8 rounded-sm shrink-0" style={{ background: b.cover_color }} />
                <div>
                  <div className="font-medium text-xs leading-tight">{b.title}</div>
                  <div className="text-[10px] text-slate-400">{b.accession_no}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </aside>

        {/* Kiosk screen */}
        <section className="p-8 grid place-items-center">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {step === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-center">
                  <div className="relative mx-auto w-44 h-44 grid place-items-center">
                    <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-pulseRing" />
                    <div className="absolute inset-4 rounded-full bg-brand-500/20 animate-pulseRing" style={{ animationDelay: "0.5s" }} />
                    <div className="w-28 h-28 rounded-full bg-brand-600 grid place-items-center text-4xl">🪪</div>
                  </div>
                  <h1 className="mt-6 text-3xl font-extrabold">Welcome to the Library</h1>
                  <p className="mt-2 text-slate-400">Tap your member card on the reader to begin<br />
                    <span className="text-xs">(pick a card from the left panel)</span></p>
                </motion.div>
              )}

              {step === "reading" && (
                <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mx-auto w-20 h-20 rounded-full border-4 border-brand-500 border-t-transparent" />
                  <p className="mt-6 text-xl font-semibold">Reading UHF card…</p>
                  <p className="text-slate-400 text-sm">865–867 MHz · EPC Gen2</p>
                </motion.div>
              )}

              {(step === "member" || step === "scanning") && member && (
                <motion.div key="member" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 mb-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-brand-600 grid place-items-center text-2xl font-bold">
                      {member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-bold">Hello, {member.name}!</div>
                      <div className="text-sm text-slate-400">{member.category} · {member.active_loans}/{member.max_books} books on loan
                        {member.unpaid_fines > 0 && <span className="text-amber-400"> · ₹{member.unpaid_fines} fines due</span>}</div>
                    </div>
                  </div>

                  {/* the RFID pad */}
                  <div className="relative rounded-2xl border-2 border-dashed border-brand-500/50 bg-brand-900/30 min-h-[180px] p-4 overflow-hidden">
                    {step === "scanning" && (
                      <motion.div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-brand-400/30 to-transparent"
                        animate={{ top: ["-20%", "110%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
                    )}
                    <div className="text-xs uppercase tracking-widest text-brand-300 mb-3">
                      RFID read pad — {pad.length}/{member.kiosk_max} books
                    </div>
                    {pad.length === 0 && <div className="text-slate-500 text-sm">Place books here (click books in the left panel)</div>}
                    <div className="flex gap-3 flex-wrap">
                      <AnimatePresence>
                        {pad.map((b) => (
                          <motion.div key={b.tag_epc} layout
                            initial={{ opacity: 0, scale: 0.6, y: -30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            className={`relative w-28 rounded-lg p-2 border ${readEpcs.includes(b.tag_epc) ? "bg-emerald-500/20 border-emerald-400" : "bg-white/10 border-white/20"}`}>
                            <div className="h-16 rounded-md mb-1.5" style={{ background: b.cover_color }} />
                            <div className="text-[10px] font-semibold leading-tight">{b.title}</div>
                            {readEpcs.includes(b.tag_epc) && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 grid place-items-center text-xs">✓</motion.div>
                            )}
                            {step === "member" && (
                              <button onClick={() => setPad((p) => p.filter((x) => x.tag_epc !== b.tag_epc))}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-700 text-[10px]">×</button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button onClick={checkout} disabled={pad.length === 0 || step === "scanning"}
                      className="btn bg-emerald-500 text-white hover:bg-emerald-600 flex-1 py-3 text-base">
                      {step === "scanning" ? "Reading tags…" : `Borrow ${pad.length} book${pad.length === 1 ? "" : "s"}`}
                    </button>
                    <button onClick={reset} className="btn border border-white/30 hover:bg-white/10">Cancel</button>
                  </div>
                </motion.div>
              )}

              {step === "done" && result && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                    className="mx-auto w-24 h-24 rounded-full bg-emerald-500 grid place-items-center text-5xl">✓</motion.div>
                  <h2 className="mt-5 text-2xl font-extrabold">
                    {result.issued.length > 0 ? "Books issued — happy reading!" : "Nothing issued"}
                  </h2>
                  <div className="mt-5 mx-auto max-w-sm rounded-xl bg-white text-slate-900 p-5 text-left font-mono text-xs shadow-2xl">
                    <div className="text-center font-bold border-b border-dashed border-slate-300 pb-2 mb-2">— RECEIPT —</div>
                    <div className="mb-1">Member: {result.member}</div>
                    {result.issued.map((b) => (
                      <div key={b.tag_epc} className="flex justify-between gap-2 py-0.5">
                        <span className="truncate">{b.title}</span><span className="whitespace-nowrap">due {b.due_date}</span>
                      </div>
                    ))}
                    {result.errors.map((e, i) => (
                      <div key={i} className="text-rose-600 py-0.5">✗ {e.title || e.tag_epc}: {e.error}</div>
                    ))}
                    <div className="text-center border-t border-dashed border-slate-300 pt-2 mt-2 text-slate-500">Security disarmed · gate will stay silent</div>
                  </div>
                  <button onClick={reset} className="btn-primary mt-6">New transaction</button>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-rose-500 grid place-items-center text-4xl">✗</div>
                  <p className="mt-4 text-xl font-semibold text-rose-300">{error}</p>
                  <button onClick={reset} className="btn-primary mt-6">Try again</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
