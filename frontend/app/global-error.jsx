"use client";
import { useEffect, useState } from "react";

export default function GlobalError({ error }) {
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    // After a deployment, open tabs still reference old build chunks and the
    // first navigation crashes. One automatic reload fetches the fresh build.
    // Guard: at most one auto-reload per minute, so a real bug can't loop.
    let last = 0;
    try { last = Number(sessionStorage.getItem("lms_auto_reload_at") || 0); } catch {}
    if (Date.now() - last > 60000) {
      try { sessionStorage.setItem("lms_auto_reload_at", String(Date.now())); } catch {}
      window.location.reload();
    } else {
      setShowUI(true);
    }
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", background: "#0f172a", color: "#fff", margin: 0 }}>
        {showUI ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>📚</div>
            <h2 style={{ margin: "12px 0 4px" }}>Something went wrong</h2>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Usually a new version was just deployed.</p>
            <button onClick={() => window.location.reload()}
              style={{ marginTop: 12, padding: "10px 20px", borderRadius: 8, border: 0, background: "#1d4ed8", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              Reload page
            </button>
          </div>
        ) : (
          <div style={{ color: "#64748b", fontSize: 14 }}>Refreshing…</div>
        )}
      </body>
    </html>
  );
}
