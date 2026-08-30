"use client";
import { useEffect, useState, useCallback } from "react";
import Shell from "../../components/Shell";
import { PageTitle, Modal, Toast, StatusBadge } from "../../components/ui";
import { api } from "../../lib/api";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", category_id: 1 });
  const [toast, setToast] = useState(null);
  const flash = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2600); };

  const load = useCallback(() => {
    api(`/members${search ? `?search=${encodeURIComponent(search)}` : ""}`).then(setMembers).catch((e) => flash(e.message, true));
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api("/members/categories").then(setCats).catch(() => {}); }, []);

  async function save() {
    try {
      const res = await api("/members", { method: "POST", body: JSON.stringify({ ...form, category_id: Number(form.category_id) }) });
      flash(`Member created — card ${res.card_epc} encoded`);
      setModal(null); load();
    } catch (e) { flash(e.message, true); }
  }

  async function setStatus(m, status) {
    try { await api(`/members/${m.id}`, { method: "PUT", body: JSON.stringify({ status }) }); load(); flash(`${m.full_name} → ${status}`); }
    catch (e) { flash(e.message, true); }
  }

  async function openDetail(id) {
    try { setDetail(await api(`/members/${id}`)); } catch (e) { flash(e.message, true); }
  }

  return (
    <Shell>
      <PageTitle title="Members" sub={`${members.length} members`} right={
        <button className="btn-primary" onClick={() => { setForm({ full_name: "", email: "", phone: "", category_id: 1 }); setModal(true); }}>+ New Member</button>} />
      <div className="card p-4 mb-4">
        <input className="input max-w-sm" placeholder="Search name, code or card EPC…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Code</th><th className="th">Name</th><th className="th">Category</th>
            <th className="th text-center">Loans</th><th className="th text-right">Fines due</th>
            <th className="th">Status</th><th className="th"></th>
          </tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="td font-mono text-xs">{m.member_code}</td>
                <td className="td font-semibold">{m.full_name}<div className="text-xs text-slate-400 font-normal">{m.email}</div></td>
                <td className="td">{m.category}</td>
                <td className="td text-center tabular-nums">{m.active_loans}/{m.max_books}</td>
                <td className="td text-right tabular-nums">{Number(m.unpaid_fines) > 0 ? <span className="text-rose-600 font-semibold">₹ {Number(m.unpaid_fines).toFixed(0)}</span> : "—"}</td>
                <td className="td"><StatusBadge status={m.status} /></td>
                <td className="td whitespace-nowrap">
                  <button className="text-brand-600 text-sm font-semibold mr-3" onClick={() => openDetail(m.id)}>History</button>
                  {m.status === "active"
                    ? <button className="text-rose-500 text-sm font-semibold" onClick={() => setStatus(m, "suspended")}>Suspend</button>
                    : <button className="text-emerald-600 text-sm font-semibold" onClick={() => setStatus(m, "active")}>Activate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title="New Member">
        <div className="grid gap-3">
          <div><label className="label">Full name</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.max_books} books / {c.loan_days} days</option>)}
            </select></div>
          <div className="text-xs text-slate-500">A UHF card EPC is generated and encoded automatically.</div>
          <button className="btn-primary" onClick={save} disabled={!form.full_name}>Create member</button>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.full_name || ""} wide>
        {detail && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="label">Card EPC</span><span className="font-mono text-xs">{detail.card_epc}</span></div>
              <div><span className="label">Category</span>{detail.category} ({detail.max_books} books / {detail.loan_days} days)</div>
            </div>
            <h4 className="font-bold text-sm mb-2">Loan history</h4>
            <table className="w-full mb-2">
              <thead><tr><th className="th">Title</th><th className="th">Issued</th><th className="th">Due</th><th className="th">Status</th></tr></thead>
              <tbody>
                {detail.loans.map((l) => (
                  <tr key={l.id}>
                    <td className="td">{l.title}</td>
                    <td className="td text-xs">{new Date(l.issued_at).toLocaleDateString()}</td>
                    <td className="td text-xs">{String(l.due_date)}</td>
                    <td className="td">{l.returned_at
                      ? <span className="badge bg-emerald-100 text-emerald-700">returned</span>
                      : l.overdue ? <span className="badge bg-rose-100 text-rose-700">overdue</span>
                        : <span className="badge bg-amber-100 text-amber-700">on loan</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Modal>
      <Toast toast={toast} />
    </Shell>
  );
}
