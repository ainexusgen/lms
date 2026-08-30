"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, setSession } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const res = await api("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setSession(res.token, res.user);
      router.push("/dashboard");
    } catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="text-xl font-extrabold">TechNexus<span className="text-brand-600">Gen</span></div>
          <div className="text-xs uppercase tracking-widest text-slate-400 mt-1">Staff Console Login</div>
        </div>
        <label className="label">Username</label>
        <input className="input mb-4" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label className="label">Password</label>
        <input className="input mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="mb-4 text-sm text-rose-600 font-medium">{err}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <div className="mt-5 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
          <b>Demo logins</b><br />admin / admin123 (administrator)<br />librarian / lib123 (librarian)
        </div>
      </motion.form>
    </div>
  );
}
