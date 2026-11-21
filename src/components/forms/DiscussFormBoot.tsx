"use client";

import { useEffect } from "react";

export function DiscussFormBoot({
  storageKey,
  compact,
  askReply = false,
}: {
  storageKey: string;
  compact: boolean;
  askReply?: boolean;
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
    const cleanups: Array<() => void> = [];
    fieldNames.forEach((name) => {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      if (!el) return;
      const key = `${storageKey}_${name}`;
      const saved = sessionStorage.getItem(key);
      if (saved && !el.value) el.value = saved;
      const onInput = () => sessionStorage.setItem(key, el.value);
      el.addEventListener("input", onInput);
      cleanups.push(() => el.removeEventListener("input", onInput));
    });

    const replyWrap = form.querySelector<HTMLLabelElement>("[data-reply-wrap]");
    const replyInput = form.querySelector<HTMLInputElement>('input[name="replyTo"]');
    const notice = form.querySelector<HTMLElement>(".lead-notice");

    const revealReply = () => {
      replyWrap?.classList.remove("hidden");
      replyWrap?.classList.add("block");
      if (replyInput) replyInput.required = true;
      if (notice) {
        notice.textContent = "Укажите телефон или email, чтобы мы ответили.";
        notice.classList.remove("hidden");
        notice.classList.add("text-brand-red");
      }
    };

    if (askReply && replyInput) {
      replyInput.required = true;
    }

    const onSubmit = (event: SubmitEvent) => {
      if (!compact) return;
      const checked = form.querySelector<HTMLInputElement>('input[name="channel"]:checked');
      const needsCallback = checked?.getAttribute("data-configured") !== "1";
      if (needsCallback && !replyInput?.value.trim()) {
        event.preventDefault();
        revealReply();
        replyInput?.focus();
      }
    };

    form.addEventListener("submit", onSubmit);
    cleanups.push(() => form.removeEventListener("submit", onSubmit));
    return () => cleanups.forEach((fn) => fn());
  }, [storageKey, compact, askReply]);

  return null;
}
