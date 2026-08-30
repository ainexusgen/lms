"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { PageTitle, Toast } from "../../components/ui";
import { api, getUser } from "../../lib/api";

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [dirty, setDirty] = useState({});
  const [toast, setToast] = useState(null);
  const isAdmin = getUser()?.role === "admin";
  const flash = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2600); };

  const load = () => api("/settings").then(setSettings).catch((e) => flash(e.message, true));
  useEffect(load, []);

  async function save(key) {
    try {
      await api("/settings", { method: "PUT", body: JSON.stringify({ key, value: String(dirty[key]) }) });
      setDirty((d) => { const n = { ...d }; delete n[key]; return n; });
      flash("Setting saved — applies immediately across kiosk, gates and circulation");
      load();
    } catch (e) { flash(e.message, true); }
  }

  const groups = settings.reduce((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});

  return (
    <Shell>
      <PageTitle title="Settings" sub={isAdmin ? "Every rule below is live-configurable — no redeploy needed" : "Read-only (sign in as admin to edit)"} />
      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat} className="card p-5 mb-4">
          <h3 className="font-bold mb-4">{cat}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((s) => (
              <div key={s.key}>
                <label className="label">{s.label}</label>
                <div className="flex gap-2">
                  {s.type === "bool" ? (
                    <select className="input" disabled={!isAdmin}
                      value={dirty[s.key] ?? s.value}
                      onChange={(e) => setDirty({ ...dirty, [s.key]: e.target.value })}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <input className="input" disabled={!isAdmin}
                      type={s.type === "int" || s.type === "float" ? "number" : "text"}
                      value={dirty[s.key] ?? s.value}
                      onChange={(e) => setDirty({ ...dirty, [s.key]: e.target.value })} />
                  )}
                  {isAdmin && dirty[s.key] !== undefined && String(dirty[s.key]) !== s.value && (
                    <button className="btn-primary" onClick={() => save(s.key)}>Save</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Toast toast={toast} />
    </Shell>
  );
}
