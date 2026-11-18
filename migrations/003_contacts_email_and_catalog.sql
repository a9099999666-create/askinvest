ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "email" varchar(255);

INSERT INTO "site_settings" ("id", "contacts_html")
SELECT 1, '<p>АСКИНВЕСТ</p><p>Оставьте заявку на сайте — мы свяжемся с вами.</p>'
WHERE NOT EXISTS (SELECT 1 FROM "site_settings" WHERE "id" = 1);

INSERT INTO "subscription_topics" ("slug", "title", "consent_text", "consent_version")
SELECT 'rent', 'Аренда', 'Согласие на получение информационных сообщений об аренде коммерческой недвижимости.', '1'
WHERE NOT EXISTS (SELECT 1 FROM "subscription_topics" LIMIT 1);

INSERT INTO "services" ("slug", "sort_order")
SELECT v.slug, v.sort_order
FROM (
  VALUES
    ('yuridicheskoe-soprovozhdenie', 1),
    ('soprovozhdenie-sdelok', 2),
    ('drugie-uslugi', 3)
) AS v(slug, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "services" LIMIT 1);

INSERT INTO "service_versions" (
  "service_id", "status", "title", "short_description", "full_description", "work_items", "version", "published_at"
)
SELECT s.id, 'published', x.title, x.short_text, x.full_text, x.items::jsonb, 1, now()
FROM "services" s
JOIN (
  VALUES
    ('yuridicheskoe-soprovozhdenie', 'Юридическое сопровождение', 'Договоры, проверка контрагентов, сопровождение сделок.', 'Юридическое сопровождение сделок и документов для бизнеса.', '[{"id":"w0","text":"Проверка документов"},{"id":"w1","text":"Подготовка договора"},{"id":"w2","text":"Сопровождение сделки"}]'),
    ('soprovozhdenie-sdelok', 'Сопровождение сделок', 'От переговоров до регистрации.', 'Сопровождение сделки с коммерческой недвижимостью от переговоров до регистрации.', '[{"id":"w0","text":"Переговоры"},{"id":"w1","text":"Структура сделки"},{"id":"w2","text":"Регистрация"}]'),
    ('drugie-uslugi', 'Другие услуги', 'Консультации и отраслевые решения для бизнеса.', 'Консультации и отраслевые решения под задачу компании.', '[{"id":"w0","text":"Консультация"},{"id":"w1","text":"Аудит задачи"},{"id":"w2","text":"Дорожная карта"}]')
) AS x(slug, title, short_text, full_text, items) ON x.slug = s.slug
WHERE NOT EXISTS (
  SELECT 1 FROM "service_versions" sv WHERE sv.service_id = s.id
);

UPDATE "services" s
SET "published_version_id" = sv.id, "updated_at" = now()
FROM "service_versions" sv
WHERE sv.service_id = s.id
  AND sv.status = 'published'
  AND s.published_version_id IS NULL;

INSERT INTO "properties" ("slug")
SELECT v.slug
FROM (
  VALUES
    ('ulitsa-brusilova-27'),
    ('schelkovskoe-shosse')
) AS v(slug)
WHERE NOT EXISTS (SELECT 1 FROM "properties" LIMIT 1);

INSERT INTO "property_versions" (
  "property_id", "status", "title", "address", "deal_type", "area_sqm", "price_rub", "price_unit", "description", "version", "published_at"
)
SELECT p.id, 'published', x.title, x.address, x.deal_type::"deal_type", x.area::numeric, x.price::numeric, x.unit::"price_unit", x.description, 1, now()
FROM "properties" p
JOIN (
  VALUES
    ('ulitsa-brusilova-27', 'Офисное помещение', 'Улица Брусилова, 27', 'sale', '215', '45000000', 'total', 'Офисное помещение для продажи. Площадь и планировку уточним при обсуждении задачи.'),
    ('schelkovskoe-shosse', 'Склад класса A', 'Щёлковское шоссе', 'rent', '1200', '1200000', 'per_month', 'Склад класса A в аренду. Условия и сроки согласовываются отдельно.')
) AS x(slug, title, address, deal_type, area, price, unit, description) ON x.slug = p.slug
WHERE NOT EXISTS (
  SELECT 1 FROM "property_versions" pv WHERE pv.property_id = p.id
);

UPDATE "properties" p
SET "published_version_id" = pv.id, "updated_at" = now()
FROM "property_versions" pv
WHERE pv.property_id = p.id
  AND pv.status = 'published'
  AND p.published_version_id IS NULL;
