import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  leads,
  messages,
  propertyVersions,
  serviceVersions,
  threads,
} from "@/db/schema";
import { getAdapter } from "@/lib/channels";

function needsHuman(text: string) {
  const t = text.toLowerCase();
  return (
    /скидк|индивидуальн|услови|подтверд.*просмотр|позвать|оператор|человек|менеджер/.test(
      t,
    ) || t.includes("позвать человека")
  );
}

export async function handleBotAutoReply(threadId: string, inboundText: string) {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });
  if (!thread) return;
  // повторная проверка режима перед отправкой
  if (thread.mode !== "bot") return;

  if (needsHuman(inboundText)) {
    await db.insert(messages).values({
      threadId,
      authorType: "system",
      body: "Запрос передан сотруднику. Оператор ответит в этой ветке.",
      isInternal: false,
      status: "delivered",
    });
    await db.insert(messages).values({
      threadId,
      authorType: "system",
      body: "Нужен оператор: клиент запросил человека или индивидуальные условия.",
      isInternal: true,
      status: "delivered",
    });
    await db
      .update(threads)
      .set({
        lastMessageAt: new Date(),
        lastPreview: "Запрос оператору",
        unreadCount: (thread.unreadCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(threads.id, threadId));
    return;
  }

  let reply =
    "Здравствуйте! Я бот АСКИНВЕСТ. Опишите задачу — подскажу по услуге или объекту. Если нужен человек, напишите «Позвать человека».";

  if (thread.leadId) {
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, thread.leadId),
    });
    if (lead?.serviceId) {
      const service = await db.query.services.findFirst({
        where: (t, { eq: e }) => e(t.id, lead.serviceId!),
      });
      if (service?.publishedVersionId) {
        const version = await db.query.serviceVersions.findFirst({
          where: eq(serviceVersions.id, service.publishedVersionId),
        });
        if (version) {
          const items = (version.workItems || [])
            .map((i) => `• ${i.text}`)
            .join("\n");
          reply = `По услуге «${version.title}»: ${version.shortDescription}\n\n${items}\n\nМогу уточнить детали или позвать сотрудника.`;
        }
      }
    } else if (lead?.propertyId) {
      const property = await db.query.properties.findFirst({
        where: (t, { eq: e }) => e(t.id, lead.propertyId!),
      });
      if (property?.publishedVersionId) {
        const version = await db.query.propertyVersions.findFirst({
          where: eq(propertyVersions.id, property.publishedVersionId),
        });
        if (version) {
          reply = `По объекту «${version.title}» (${version.address}): площадь ${version.areaSqm} м². Могу ответить на вопрос или записать на просмотр — напишите удобное время. Для скидки или особых условий позовите человека.`;
        }
      }
    } else if (lead?.question) {
      reply = `Получили ваш вопрос: «${lead.question.slice(0, 200)}». Уточните, пожалуйста, услугу или объект — либо напишите «Позвать человека».`;
    }
  }

  // ещё раз проверяем режим
  const again = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });
  if (!again || again.mode !== "bot") return;

  const adapter = getAdapter(thread.channel);
  const send = await adapter.sendText({
    externalThreadId: thread.externalThreadId || "",
    externalUserId: "",
    text: reply,
  });

  await db.insert(messages).values({
    threadId,
    authorType: "bot",
    body: reply,
    status: send.status === "failed" ? "failed" : "accepted",
    externalMessageId: send.externalMessageId || null,
    meta: send.error ? { error: send.error } : {},
  });

  await db
    .update(threads)
    .set({
      lastMessageAt: new Date(),
      lastPreview: reply.slice(0, 200),
      updatedAt: new Date(),
    })
    .where(eq(threads.id, threadId));
}
