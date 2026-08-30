"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Stale-build chunk errors: one automatic reload fetches the fresh build.
    const msg = String(error?.message || "");
    const isChunk = /ChunkLoadError|Loading chunk|failed to fetch dynamically imported/i.test(msg);
    const key = "lms_auto_reloaded";
    if (isChunk && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      window.location.reload();
    } else {
      sessionStorage.removeItem(key);
    }
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", background: "#0f172a", color: "#fff", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>📚</div>
          <h2 style={{ margin: "12px 0 4px" }}>Something went wrong</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Usually a new version was just deployed.</p>
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 12, padding: "10px 20px", borderRadius: 8, border: 0, background: "#1d4ed8", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
