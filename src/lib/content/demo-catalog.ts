import type { PlaceKind, WorkItem } from "@/lib/content/kinds";

export type DemoService = {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  workItems: WorkItem[];
};

export type DemoProperty = {
  slug: string;
  title: string;
  address: string;
  dealType: "sale" | "rent";
  placeKind: PlaceKind;
  areaSqm: string;
  priceRub: string;
  priceUnit: "total" | "per_month";
  description: string;
};

export const DEMO_SERVICES: DemoService[] = [
  {
    slug: "yuridicheskoe-soprovozhdenie",
    title: "Юридическое сопровождение",
    shortDescription: "Договоры, проверка контрагентов, сопровождение сделок.",
    fullDescription: "Договоры, проверка контрагентов, сопровождение сделок.",
    workItems: [
      { id: "w0", text: "Проверим документы", icon: "doc" },
      { id: "w1", text: "Подготовим договор", icon: "pen" },
      { id: "w2", text: "Сопроводим сделку", icon: "handshake" },
    ],
  },
  {
    slug: "soprovozhdenie-sdelok",
    title: "Сопровождение сделок",
    shortDescription: "От переговоров до регистрации.",
    fullDescription: "От переговоров до регистрации.",
    workItems: [
      { id: "w0", text: "Проверим документы", icon: "doc" },
      { id: "w1", text: "Подготовим договор", icon: "pen" },
      { id: "w2", text: "Согласуем порядок сделки", icon: "handshake" },
    ],
  },
];

export const DEMO_PROPERTIES: DemoProperty[] = [
  {
    slug: "ulitsa-brusilova-27",
    title: "Офисное помещение",
    address: "Улица Брусилова, 27",
    dealType: "sale",
    placeKind: "office",
    areaSqm: "215",
    priceRub: "45000000",
    priceUnit: "total",
    description: "Офисное помещение в действующем бизнес-центре.",
  },
  {
    slug: "schelkovskoe-shosse",
    title: "Склад класса A",
    address: "Щёлковское шоссе",
    dealType: "rent",
    placeKind: "warehouse",
    areaSqm: "1200",
    priceRub: "1200000",
    priceUnit: "per_month",
    description: "Склад класса A с удобным заездом со Щёлковского шоссе.",
  },
  {
    slug: "starobitsevskaya-ulitsa",
    title: "Офис на Старобитцевской",
    address: "Старобитцевская улица",
    dealType: "sale",
    placeKind: "office",
    areaSqm: "186",
    priceRub: "38500000",
    priceUnit: "total",
    description: "Офисный блок на Старобитцевской улице.",
  },
];

const areaBands: Record<string, { min?: number; max?: number }> = {
  "100": { max: 100 },
  "300": { min: 100, max: 300 },
  "1000": { min: 300, max: 1000 },
  "1000p": { min: 1000 },
};

export function demoServiceBySlug(slug: string) {
  return DEMO_SERVICES.find((item) => item.slug === slug) ?? null;
}

export function demoPropertyBySlug(slug: string) {
  return DEMO_PROPERTIES.find((item) => item.slug === slug) ?? null;
}

export function filterDemoProperties(deal: string, q: string, area: string) {
  const band = areaBands[area];
  const query = q.trim().toLowerCase();
  return DEMO_PROPERTIES.filter((item) => {
    if (deal === "sale" || deal === "rent") {
      if (item.dealType !== deal) return false;
    }
    if (query && !item.address.toLowerCase().includes(query)) return false;
    const sqm = Number(item.areaSqm);
    if (band?.min != null && sqm < band.min) return false;
    if (band?.max != null && sqm > band.max) return false;
    return true;
  });
}
