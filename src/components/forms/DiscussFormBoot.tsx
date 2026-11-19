"use client";

import { useEffect } from "react";

export function DiscussFormBoot({
  storageKey,
  compact,
}: {
  storageKey: string;
  compact: boolean;
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
      ? ["question", "replyTo"]
      : ["visitorName", "visitorPhone", "visitorEmail", "question"];
    fieldNames.forEach((name) => {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      if (!el) return;
      const key = `${storageKey}_${name}`;
      const saved = sessionStorage.getItem(key);
      if (saved && !el.value) el.value = saved;
      el.addEventListener("input", () => sessionStorage.setItem(key, el.value));
    });

    const replyWrap = form.querySelector<HTMLLabelElement>("[data-reply-wrap]");
    const replyInput = form.querySelector<HTMLInputElement>('input[name="replyTo"]');

    const syncReply = () => {
      const checked = form.querySelector<HTMLInputElement>('input[name="channel"]:checked');
      const needsCallback = compact && checked?.getAttribute("data-configured") !== "1";
      if (replyWrap) replyWrap.classList.toggle("hidden", !needsCallback);
      if (replyInput) replyInput.required = Boolean(needsCallback);
    };

    form.querySelectorAll<HTMLInputElement>('input[name="channel"]').forEach((el) => {
      el.addEventListener("change", syncReply);
    });
    syncReply();
  }, [storageKey, compact]);

  return null;
}
