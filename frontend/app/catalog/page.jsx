"use client";
import { useEffect, useState, useCallback } from "react";
import Shell from "../../components/Shell";
import { PageTitle, Modal, Toast, StatusBadge } from "../../components/ui";
import { api } from "../../lib/api";

const EMPTY = { title: "", author: "", isbn: "", publisher: "", category: "Computer Science", year: "", shelf: "", copies: 1 };

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modal, setModal] = useState(null); // {mode:'add'|'edit'|'view', book}
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState(null);

  const flash = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2600); };

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (category) p.set("category", category);
    api(`/books?${p}`).then(setBooks).catch((e) => flash(e.message, true));
    api("/books/categories").then(setCats).catch(() => {});
  }, [search, category]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function openView(id) {
    try { setModal({ mode: "view", book: await api(`/books/${id}`) }); }
    catch (e) { flash(e.message, true); }
  }

  async function save() {
    try {
      if (modal.mode === "add") {
        await api("/books", { method: "POST", body: JSON.stringify({ ...form, year: form.year ? Number(form.year) : null, copies: Number(form.copies) || 1 }) });
        flash("Book added with RFID tags generated");
      } else {
        await api(`/books/${modal.book.id}`, { method: "PUT", body: JSON.stringify({ ...form, year: form.year ? Number(form.year) : null }) });
        flash("Book updated");
      }
      setModal(null); load();
    } catch (e) { flash(e.message, true); }
  }

  function edit(b) {
    setForm({ title: b.title, author: b.author, isbn: b.isbn || "", publisher: b.publisher || "", category: b.category, year: b.year || "", shelf: b.shelf || "" });
    setModal({ mode: "edit", book: b });
  }

  return (
    <Shell>
      <PageTitle title="Catalog" sub={`${books.length} titles`} right={
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal({ mode: "add" }); }}>+ Add Book</button>} />
      <div className="card p-4 mb-4 flex gap-3 flex-wrap">
        <input className="input max-w-xs" placeholder="Search title, author, ISBN…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[200px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.category} value={c.category}>{c.category} ({c.n})</option>)}
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Title</th><th className="th">Author</th><th className="th">Category</th>
            <th className="th">Shelf</th><th className="th text-center">Copies</th><th className="th text-center">Available</th><th className="th"></th>
          </tr></thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="td font-semibold">{b.title}</td>
                <td className="td text-slate-600">{b.author}</td>
                <td className="td"><span className="badge bg-brand-100 text-brand-700">{b.category}</span></td>
                <td className="td">{b.shelf}</td>
                <td className="td text-center tabular-nums">{b.total_copies}</td>
                <td className="td text-center tabular-nums font-semibold">{b.available_copies > 0
                  ? <span className="text-emerald-600">{b.available_copies}</span>
                  : <span className="text-rose-600">0</span>}</td>
                <td className="td whitespace-nowrap">
                  <button className="text-brand-600 text-sm font-semibold mr-3" onClick={() => openView(b.id)}>Copies</button>
                  <button className="text-slate-500 text-sm font-semibold" onClick={() => edit(b)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal && modal.mode !== "view"} onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Add Book" : "Edit Book"}>
        <div className="grid gap-3">
          {["title", "author", "isbn", "publisher", "category", "year", "shelf"].map((f) => (
            <div key={f}>
              <label className="label">{f}</label>
              <input className="input" value={form[f] ?? ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
            </div>
          ))}
          {modal?.mode === "add" && (
            <div>
              <label className="label">Copies (RFID tags auto-generated)</label>
              <input className="input" type="number" min="1" max="20" value={form.copies}
                onChange={(e) => setForm({ ...form, copies: e.target.value })} />
            </div>
          )}
          <button className="btn-primary mt-2" onClick={save}>Save</button>
        </div>
      </Modal>

      <Modal open={!!modal && modal.mode === "view"} onClose={() => setModal(null)}
        title={modal?.book?.title || ""} wide>
        {modal?.book?.copies && (
          <table className="w-full">
            <thead><tr><th className="th">Accession</th><th className="th">RFID Tag EPC</th><th className="th">Status</th><th className="th">Security</th></tr></thead>
            <tbody>
              {modal.book.copies.map((c) => (
                <tr key={c.id}>
                  <td className="td font-mono text-xs">{c.accession_no}</td>
                  <td className="td font-mono text-xs">{c.tag_epc}</td>
                  <td className="td"><StatusBadge status={c.status} /></td>
                  <td className="td">{c.security_bit ? "🔒 armed" : "🔓 disarmed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
      <Toast toast={toast} />
    </Shell>
  );
}
