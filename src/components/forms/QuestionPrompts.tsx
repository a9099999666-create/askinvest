"use client";

export function QuestionPrompts({ prompts }: { prompts: string[] }) {
  if (prompts.length === 0) return null;

  function fill(text: string, button: HTMLButtonElement) {
    const form = button.closest("form");
    const field = form?.querySelector<HTMLTextAreaElement>('textarea[name="question"]');
    if (!field) return;
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.focus();
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-ink/70 transition hover:border-sky-200 hover:bg-sky-50 hover:text-ink"
          onClick={(e) => fill(prompt, e.currentTarget)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
