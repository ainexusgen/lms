"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { API } from "../../lib/api";

export default function Opac() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [branding, setBranding] = useState({});

  useEffect(() => {
    fetch(`${API}/api/settings/public`).then((r) => r.json()).then(setBranding).catch(() => {});
  }, []);

  const load = useCallback(() => {
    fetch(`${API}/api/opac/search${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then((r) => r.json()).then(setBooks).catch(() => {});
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold">{branding.library_name || "Library Catalogue"}</h1>
              <p className="text-brand-200 text-sm">{branding.library_tagline || "Online Public Access Catalogue"}</p>
            </div>
            <Link href="/" className="text-sm text-brand-200 hover:text-white">← Demo home</Link>
          </div>
          <input className="mt-6 w-full rounded-xl px-5 py-3.5 text-slate-900 text-lg focus:outline-none focus:ring-4 focus:ring-brand-400"
            placeholder="Search by title or author…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}
            className="card p-4 flex gap-3">
            <div className="w-12 h-16 rounded-md shrink-0 shadow" style={{ background: b.cover_color }} />
            <div className="min-w-0">
              <div className="font-bold leading-tight truncate">{b.title}</div>
              <div className="text-sm text-slate-500 truncate">{b.author}</div>
              <div className="text-xs text-slate-400 mt-0.5">{b.category} · Shelf {b.shelf}</div>
              <div className="mt-1.5">
                {b.available_copies > 0
                  ? <span className="badge bg-emerald-100 text-emerald-700">Available · {b.available_copies} of {b.total_copies}</span>
                  : <span className="badge bg-rose-100 text-rose-700">All copies on loan</span>}
              </div>
            </div>
          </motion.div>
        ))}
        {books.length === 0 && <div className="text-slate-400 col-span-full text-center py-16">No titles match your search.</div>}
      </main>
    </div>
  );
}
