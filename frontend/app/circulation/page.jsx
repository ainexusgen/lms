"use client";
import { useEffect, useState, useCallback } from "react";
import Shell from "../../components/Shell";
import { PageTitle, Toast } from "../../components/ui";
import { api } from "../../lib/api";

const TABS = ["Open Loans", "Overdue", "Reservations", "Fines"];

export default function Circulation() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [toast, setToast] = useState(null);
  const flash = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2600); };

  const load = useCallback(() => {
    const src = tab === 0 ? api("/circulation/loans?status=open")
      : tab === 1 ? api("/circulation/loans?status=overdue")
      : tab === 2 ? api("/circulation/reservations")
      : api("/circulation/fines");
    src.then(setRows).catch((e) => flash(e.message, true));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function renew(id) {
    try { const r = await api("/circulation/renew", { method: "POST", body: JSON.stringify({ loan_id: id }) }); flash(`Renewed — new due date ${r.new_due_date}`); load(); }
    catch (e) { flash(e.message, true); }
  }
  async function ret(epc) {
    try { const r = await api("/circulation/return", { method: "POST", body: JSON.stringify({ tag_epcs: [epc] }) });
      const x = r.returned[0]; flash(`Returned: ${x.title}${x.fine > 0 ? ` — fine ₹${x.fine}` : ""}`); load(); }
    catch (e) { flash(e.message, true); }
  }
  async function pay(id) {
    try { await api("/circulation/fines/pay", { method: "POST", body: JSON.stringify({ fine_id: id }) }); flash("Fine collected"); load(); }
    catch (e) { flash(e.message, true); }
  }

  return (
    <Shell>
      <PageTitle title="Circulation" sub="Staff desk — loans, renewals, reservations and fines. For RFID issue/return use the Kiosk & Book Drop simulators." />
      <div className="flex gap-2 mb-4">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`btn ${i === tab ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}>{t}</button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        {tab <= 1 && (
          <table className="w-full">
            <thead><tr><th className="th">Title</th><th className="th">Member</th><th className="th">Issued</th><th className="th">Due</th><th className="th">Via</th><th className="th"></th></tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className={l.overdue ? "bg-rose-50" : "hover:bg-slate-50"}>
                  <td className="td font-semibold">{l.title}<div className="text-xs text-slate-400 font-mono font-normal">{l.accession_no}</div></td>
                  <td className="td">{l.full_name}<div className="text-xs text-slate-400">{l.member_code}</div></td>
                  <td className="td text-xs">{new Date(l.issued_at).toLocaleDateString()}</td>
                  <td className="td text-xs">{String(l.due_date)}{l.overdue && <span className="ml-1 badge bg-rose-100 text-rose-700">{l.overdue_days}d late</span>}</td>
                  <td className="td text-xs capitalize">{l.issued_via}</td>
                  <td className="td whitespace-nowrap">
                    <button className="text-brand-600 text-sm font-semibold mr-3" onClick={() => renew(l.id)}>Renew</button>
                    <button className="text-emerald-600 text-sm font-semibold" onClick={() => ret(l.tag_epc)}>Return</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 2 && (
          <table className="w-full">
            <thead><tr><th className="th">Title</th><th className="th">Member</th><th className="th">Reserved</th><th className="th">Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="td font-semibold">{r.title}</td>
                  <td className="td">{r.full_name}</td>
                  <td className="td text-xs">{new Date(r.reserved_at).toLocaleString()}</td>
                  <td className="td"><span className={`badge ${r.status === "ready" ? "bg-brand-100 text-brand-700" : r.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 3 && (
          <table className="w-full">
            <thead><tr><th className="th">Member</th><th className="th text-right">Amount</th><th className="th">Reason</th><th className="th">Created</th><th className="th">Status</th><th className="th"></th></tr></thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="td font-semibold">{f.full_name}<div className="text-xs text-slate-400">{f.member_code}</div></td>
                  <td className="td text-right tabular-nums font-semibold">₹ {Number(f.amount).toFixed(2)}</td>
                  <td className="td capitalize">{f.reason}</td>
                  <td className="td text-xs">{new Date(f.created_at).toLocaleDateString()}</td>
                  <td className="td">{f.paid_at ? <span className="badge bg-emerald-100 text-emerald-700">paid</span> : <span className="badge bg-rose-100 text-rose-700">unpaid</span>}</td>
                  <td className="td">{!f.paid_at && <button className="text-emerald-600 text-sm font-semibold" onClick={() => pay(f.id)}>Collect</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Toast toast={toast} />
    </Shell>
  );
}
