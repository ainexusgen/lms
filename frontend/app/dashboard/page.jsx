"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { PageTitle, StatTile } from "../../components/ui";
import { api } from "../../lib/api";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

const KIND_ICON = { issue: "📕", return: "📗", renew: "🔄", reserve: "🔖", fine: "💰", alarm: "🚨", entry: "🚪", admin: "⚙️" };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [daily, setDaily] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      api("/reports/dashboard"),
      api("/reports/circulation-daily?days=14"),
      api("/reports/attendance-daily?days=14"),
    ]).then(([d, c, a]) => {
      setData(d);
      setDaily(c.map((r) => ({ ...r, day: String(r.day).slice(5) })));
      setAttendance(a.map((r) => ({ ...r, day: String(r.day).slice(5) })));
    }).catch((e) => setErr(e.message));
  }, []);

  return (
    <Shell>
      <PageTitle title="Dashboard" sub="Live view of circulation, security and footfall" />
      {err && <div className="card p-4 text-rose-600 mb-4">{err}</div>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatTile label="Titles / Copies" value={`${data.stats.total_books} / ${data.stats.total_copies}`} delay={0} />
            <StatTile label="Books on loan" value={data.stats.on_loan} delay={0.05} />
            <StatTile label="Overdue" value={data.stats.overdue} accent="text-rose-600" delay={0.1} />
            <StatTile label="Active members" value={data.stats.active_members} delay={0.15} />
            <StatTile label="Unpaid fines" value={`₹ ${Number(data.stats.unpaid_fines).toFixed(0)}`} accent="text-amber-600" delay={0.2} />
            <StatTile label="Today's footfall" value={data.stats.todays_footfall} delay={0.25} />
            <StatTile label="Gate alarms (7d)" value={data.stats.alarms_7d} accent="text-rose-600" delay={0.3} />
            <StatTile label="Reservations" value={data.stats.reservations} delay={0.35} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <div className="card p-5">
              <h3 className="font-bold mb-3">Circulation — last 14 days</h3>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="issues" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.15} name="Issues" />
                    <Area type="monotone" dataKey="returns" stroke="#059669" fill="#059669" fillOpacity={0.15} name="Returns" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-bold mb-3">Entrance footfall — last 14 days</h3>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={attendance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Bar dataKey="entries" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Entries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-3">Recent activity</h3>
            <ul className="divide-y divide-slate-100">
              {data.activity.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center gap-3 text-sm">
                  <span className="text-lg">{KIND_ICON[a.kind] || "•"}</span>
                  <span className="flex-1">{a.message}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(a.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Shell>
  );
}
