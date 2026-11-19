"use client";

import { useEffect } from "react";

export function DiscussFormBoot({
  storageKey,
  compact,
  anyLive,
}: {
  storageKey: string;
  compact: boolean;
  anyLive: boolean;
}) {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(
      `form[data-storage-key="${storageKey}"]`,
    );
    if (!form) return;

    let publicKey = sessionStorage.getItem(storageKey);
    if (!publicKey) {
      publicKey = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(storageKey, publicKey);
    }
    const publicKeyInput = form.querySelector<HTMLInputElement>('input[name="publicKey"]');
    if (publicKeyInput) publicKeyInput.value = publicKey;

    const fieldNames = compact
      ? anyLive
        ? ["question"]
        : ["question", "replyTo"]
      : ["visitorName", "visitorPhone", "visitorEmail", "question"];
    fieldNames.forEach((name) => {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      if (!el) return;
      const key = `${storageKey}_${name}`;
      const saved = sessionStorage.getItem(key);
      if (saved && !el.value) el.value = saved;
      el.addEventListener("input", () => sessionStorage.setItem(key, el.value));
    });

    const syncSubmit = () => {
      const checked = form.querySelector<HTMLInputElement>('input[name="channel"]:checked');
      const label = form.querySelector("[data-submit-label]");
      if (!label || !compact) return;
      if (checked?.getAttribute("data-configured") === "1") {
        label.textContent = `Продолжить в ${checked.getAttribute("data-label") || ""}`;
      }
    };
    form.querySelectorAll<HTMLInputElement>('input[name="channel"]').forEach((el) => {
      el.addEventListener("change", syncSubmit);
    });
    syncSubmit();
  }, [storageKey, compact, anyLive]);

  return null;
}
