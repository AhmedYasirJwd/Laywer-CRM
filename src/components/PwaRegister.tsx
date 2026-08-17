"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "lexcase-install-prompt-dismissed";

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed", err);
      });
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      const alreadyDismissed = localStorage.getItem(DISMISS_KEY);
      const alreadyStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error -- iOS Safari-only property
        window.navigator.standalone === true;
      if (alreadyDismissed || alreadyStandalone) return;
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-xl lg:bottom-6 lg:left-6 lg:right-auto lg:mx-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Download size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">Install LexCase</p>
        <p className="text-xs text-muted">Add it to your home screen for quick, offline-friendly access.</p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90"
      >
        Install
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-faint hover:bg-background"
      >
        <X size={15} />
      </button>
    </div>
  );
}
