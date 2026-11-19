const steps = [
  {
    n: "01",
    title: "Пишете задачу",
    text: "Коротко, своими словами. Даже если ещё нет документов.",
  },
  {
    n: "02",
    title: "Разбираем за день",
    text: "Смотрим суть, а не форму: что нужно проверить, согласовать или найти.",
  },
  {
    n: "03",
    title: "Предлагаем путь",
    text: "Понятный следующий шаг: услуга, объект или созвон.",
  },
];

export function HowWeWork() {
  return (
    <section className="mt-10 lg:mt-14">
      <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">Как мы работаем</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.n} className="glass-panel rounded-[24px] px-5 py-5">
            <div className="text-sm font-semibold text-[#ff3142]">{step.n}</div>
            <h3 className="mt-2 text-lg font-semibold text-ink">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
