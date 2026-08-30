"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { PageTitle } from "../../components/ui";
import { api } from "../../lib/api";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export default function Reports() {
  const [top, setTop] = useState([]);
  const [dist, setDist] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      api("/reports/top-books?limit=8"),
      api("/reports/category-distribution"),
      api("/reports/overdue"),
    ]).then(([t, d, o]) => { setTop(t); setDist(d); setOverdue(o); })
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <Shell>
      <PageTitle title="Reports" sub="Collection analytics and follow-up lists" />
      {err && <div className="card p-4 text-rose-600 mb-4">{err}</div>}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="card p-5">
          <h3 className="font-bold mb-3">Most issued titles</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={top} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="title" width={170} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="loans" fill="#1d4ed8" radius={[0, 4, 4, 0]} name="Loans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-bold mb-3">Collection by category</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={dist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Legend />
                <Bar dataKey="copies" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Total copies" />
                <Bar dataKey="on_loan" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="On loan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="p-5 pb-0"><h3 className="font-bold">Overdue follow-up list</h3></div>
        <table className="w-full mt-3">
          <thead><tr>
            <th className="th">Title</th><th className="th">Member</th><th className="th">Phone</th>
            <th className="th">Due date</th><th className="th text-right">Days overdue</th>
          </tr></thead>
          <tbody>
            {overdue.map((o) => (
              <tr key={o.id} className="bg-rose-50/50">
                <td className="td font-semibold">{o.title}</td>
                <td className="td">{o.full_name} <span className="text-xs text-slate-400">{o.member_code}</span></td>
                <td className="td text-sm">{o.phone}</td>
                <td className="td text-sm">{String(o.due_date)}</td>
                <td className="td text-right font-bold text-rose-600 tabular-nums">{o.days_overdue}</td>
              </tr>
            ))}
            {overdue.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>Nothing overdue 🎉</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
