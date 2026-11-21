export const workIcons = ["doc", "pen", "handshake"] as const;
export type WorkIconKind = (typeof workIcons)[number];

export type WorkItem = {
  id: string;
  text: string;
  icon?: WorkIconKind;
};

export const placeKinds = [
  "office",
  "warehouse",
  "retail",
  "production",
  "other",
] as const;
export type PlaceKind = (typeof placeKinds)[number];

export const placeKindLabel: Record<PlaceKind, string> = {
  office: "Офис",
  warehouse: "Склад",
  retail: "Торговое",
  production: "Производство",
  other: "Помещение",
};

export function asPlaceKind(value: string | null | undefined): PlaceKind {
  return placeKinds.includes(value as PlaceKind) ? (value as PlaceKind) : "other";
}

export function workIconFor(item: WorkItem, index: number): WorkIconKind {
  if (item.icon && workIcons.includes(item.icon)) return item.icon;
  return workIcons[index % workIcons.length];
}

export function isPublicServiceTitle(title: string) {
  const value = title.trim();
  if (value.length < 4) return false;
  if (/черновик/i.test(value)) return false;
  if (/\d{10,}/.test(value)) return false;
  if (/проверк/i.test(value)) return false;
  if (/приёмк|приемк/i.test(value)) return false;
  if (/^другие услуги$/i.test(value)) return false;
  return true;
}
