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
      ? ["question"]
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
      if (!checked || !label || !compact) return;
      const live = checked.getAttribute("data-configured") === "1";
      const name = checked.getAttribute("data-label") || "";
      label.textContent = live ? `Написать в ${name}` : "Оставить заявку";
    };
    form.querySelectorAll<HTMLInputElement>('input[name="channel"]').forEach((el) => {
      el.addEventListener("change", syncSubmit);
    });
    syncSubmit();

    const flag = new URLSearchParams(location.search).get("lead");
    const note = form.querySelector(".lead-notice");
    if (!note) return;
    if (flag === "ok") {
      note.textContent = compact
        ? "Заявка принята. Мы получили ваш вопрос."
        : "Заявка принята. Мы свяжемся с вами по указанным контактам.";
      note.className = "lead-notice mt-3 text-sm text-emerald-700";
      note.classList.remove("hidden");
      fieldNames.forEach((name) => sessionStorage.removeItem(`${storageKey}_${name}`));
    } else if (flag === "error") {
      note.textContent = "Не удалось сохранить. Проверьте поля и нажмите ещё раз.";
      note.className = "lead-notice mt-3 text-sm text-brand-red";
      note.classList.remove("hidden");
    }
  }, [storageKey, compact]);

  return null;
}
