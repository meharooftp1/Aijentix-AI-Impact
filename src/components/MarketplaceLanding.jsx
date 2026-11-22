import React, { useEffect, useState } from "react";
import { getCurrentUser, signIn } from "../lib/authApi";
import BrandLogo from "./BrandLogo";

export default function MarketplaceLanding() {
  const [status, setStatus] = useState("checking"); // checking | needsAuth | activating | done | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setStatus("needsAuth");
        return;
      }

      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setStatus("error");
        setMessage("No purchase token found in the URL. Please return to AppSource and try again.");
        return;
      }

      setStatus("activating");
      try {
        const res = await fetch("/api/marketplace/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Activation failed");
        setStatus("done");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } catch (err) {
        setStatus("error");
        setMessage(err.message);
      }
    };
    run();
  }, []);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-full rounded-xl bg-gradient-to-br from-teal-dark to-slate-950 px-5 py-4 mb-6">
          <BrandLogo className="h-9 w-auto mx-auto" />
          <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/60">AI Value &amp; Impact</div>
        </div>

        {status === "checking" && <p className="text-ink/60">Checking your account…</p>}

        {status === "needsAuth" && (
          <>
            <p className="text-ink/70 mb-5">
              Sign in with your work Microsoft account to activate your subscription.
            </p>
            <button
              onClick={signIn}
              className="bg-teal text-paper rounded px-5 py-2.5 font-medium hover:bg-teal-dark"
            >
              Sign in with Microsoft
            </button>
          </>
        )}

        {status === "activating" && <p className="text-ink/60">Activating your subscription…</p>}

        {status === "done" && (
          <p className="text-teal font-medium">
            Subscription activated. Redirecting you to the app…
          </p>
        )}

        {status === "error" && (
          <>
            <p className="text-clay font-medium mb-2">Something went wrong</p>
            <p className="text-sm text-ink/60">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
