"use client";
import { motion, AnimatePresence } from "framer-motion";

export function PageTitle({ title, sub, right }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-extrabold tracking-tight">{title}</motion.h1>
        {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatTile({ label, value, accent = "text-brand-600", delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }} className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tabular-nums ${accent}`}>{value}</div>
    </motion.div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div onMouseDown={(e) => e.stopPropagation()}
            className={`card w-full ${wide ? "max-w-2xl" : "max-w-md"} p-6 max-h-[85vh] overflow-y-auto`}
            initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${toast.err ? "bg-rose-600" : "bg-emerald-600"}`}>
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StatusBadge({ status }) {
  const map = {
    available: "bg-emerald-100 text-emerald-700",
    on_loan: "bg-amber-100 text-amber-700",
    active: "bg-emerald-100 text-emerald-700",
    suspended: "bg-rose-100 text-rose-700",
    expired: "bg-slate-200 text-slate-600",
    pending: "bg-amber-100 text-amber-700",
    ready: "bg-brand-100 text-brand-700",
    fulfilled: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-200 text-slate-600",
  };
  return <span className={`badge ${map[status] || "bg-slate-200 text-slate-600"}`}>{String(status).replace("_", " ")}</span>;
}
