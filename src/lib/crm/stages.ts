export const leadStages = [
  { id: "new", title: "Вопрос" },
  { id: "in_progress", title: "Созвон" },
  { id: "done", title: "Закрыто" },
] as const;

export function leadStageLabel(stage: string) {
  return leadStages.find((item) => item.id === stage)?.title || stage;
}
