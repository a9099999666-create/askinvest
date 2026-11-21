import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  properties,
  propertyVersions,
  services,
  serviceVersions,
  siteSettings,
} from "@/db/schema";
import type { SessionUser } from "@/lib/auth/permissions";
import { can } from "@/lib/auth/permissions";
import { revalidatePublic } from "@/lib/public/revalidate";
import { slugify } from "@/lib/utils";

export async function createServiceDraft(
  user: SessionUser,
  data: {
    title: string;
    slug?: string;
    shortDescription?: string;
    fullDescription?: string;
    workItems?: { id: string; text: string; icon?: "doc" | "pen" | "handshake" }[];
    imageId?: string | null;
    sortOrder?: number;
  },
) {
  if (!can(user, "editContent")) throw new Error("Нет права редактирования");
  if (!data.title?.trim()) throw new Error("Укажите название услуги");
  const slugBase = slugify(data.slug || data.title) || "usluga";
  let slug = slugBase;
  let n = 1;
  while (await db.query.services.findFirst({ where: eq(services.slug, slug) })) {
    slug = `${slugBase}-${++n}`;
  }
  const maxOrder = await db
    .select({ v: sql<number>`max(${services.sortOrder})` })
    .from(services);
  const [service] = await db
    .insert(services)
    .values({
      slug,
      sortOrder:
        typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder)
          ? Math.round(data.sortOrder)
          : Number(maxOrder[0]?.v || 0) + 1,
    })
    .returning();
  const [version] = await db
    .insert(serviceVersions)
    .values({
      serviceId: service.id,
      status: "draft",
      title: data.title,
      shortDescription: data.shortDescription || "",
      fullDescription: data.fullDescription || "",
      workItems: data.workItems || [],
      imageId: data.imageId || null,
      version: 1,
      createdById: user.id,
    })
    .returning();
  return { service, version };
}

export async function saveServiceVersion(
  user: SessionUser,
  serviceId: string,
  expectedUpdatedAt: string,
  patch: Partial<{
    title: string;
    slug: string;
    shortDescription: string;
    fullDescription: string;
    workItems: { id: string; text: string; icon?: "doc" | "pen" | "handshake" }[];
    imageId: string | null;
    sortOrder: number;
    status: "draft" | "review";
  }>,
) {
  if (!can(user, "editContent")) throw new Error("Нет права редактирования");
  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
  });
  if (!service) throw new Error("Услуга не найдена");
  if (patch.slug && patch.slug !== service.slug) {
    const slug = slugify(patch.slug) || service.slug;
    const taken = await db.query.services.findFirst({
      where: and(eq(services.slug, slug), ne(services.id, serviceId)),
    });
    if (taken) throw new Error("Такой адрес страницы уже занят");
    await db
      .update(services)
      .set({ slug, updatedAt: new Date() })
      .where(eq(services.id, serviceId));
  }
  if (typeof patch.sortOrder === "number" && Number.isFinite(patch.sortOrder)) {
    await db
      .update(services)
      .set({ sortOrder: Math.round(patch.sortOrder), updatedAt: new Date() })
      .where(eq(services.id, serviceId));
  }

  const current = await getEditableServiceVersion(serviceId);
  if (!current) throw new Error("Нет версии");

  if (
    expectedUpdatedAt &&
    new Date(current.updatedAt).toISOString() !==
      new Date(expectedUpdatedAt).toISOString()
  ) {
    const err = new Error("VERSION_CONFLICT") as Error & {
      current: typeof current;
    };
    err.current = current;
    throw err;
  }

  // Редактирование опубликованной — новая черновая версия
  if (current.status === "published") {
    const max = await db
      .select({ v: sql<number>`max(${serviceVersions.version})` })
      .from(serviceVersions)
      .where(eq(serviceVersions.serviceId, serviceId));
    const nextVersion = Number(max[0]?.v || current.version) + 1;
    const [created] = await db
      .insert(serviceVersions)
      .values({
        serviceId,
        status: patch.status || "draft",
        title: patch.title ?? current.title,
        shortDescription: patch.shortDescription ?? current.shortDescription,
        fullDescription: patch.fullDescription ?? current.fullDescription,
        workItems: patch.workItems ?? current.workItems,
        imageId: patch.imageId === undefined ? current.imageId : patch.imageId,
        version: nextVersion,
        createdById: user.id,
      })
      .returning();
    return created;
  }

  const [updated] = await db
    .update(serviceVersions)
    .set({
      title: patch.title ?? current.title,
      shortDescription: patch.shortDescription ?? current.shortDescription,
      fullDescription: patch.fullDescription ?? current.fullDescription,
      workItems: patch.workItems ?? current.workItems,
      imageId: patch.imageId === undefined ? current.imageId : patch.imageId,
      status: patch.status ?? current.status,
      updatedAt: new Date(),
    })
    .where(eq(serviceVersions.id, current.id))
    .returning();
  return updated;
}

export async function publishService(user: SessionUser, serviceId: string) {
  if (!can(user, "publish")) throw new Error("Нет права публикации");
  const draft = await getEditableServiceVersion(serviceId);
  if (!draft) throw new Error("Нет версии");
  return db.transaction(async (tx) => {
    await tx
      .update(serviceVersions)
      .set({ status: "archived", updatedAt: new Date() })
      .where(
        and(
          eq(serviceVersions.serviceId, serviceId),
          eq(serviceVersions.status, "published"),
        ),
      );
    const [published] = await tx
      .update(serviceVersions)
      .set({
        status: "published",
        publishedAt: new Date(),
        publishedById: user.id,
        updatedAt: new Date(),
      })
      .where(eq(serviceVersions.id, draft.id))
      .returning();
    await tx
      .update(services)
      .set({ publishedVersionId: published.id, updatedAt: new Date() })
      .where(eq(services.id, serviceId));
    return published;
  }).then((published) => {
    revalidatePublic();
    return published;
  });
}

export async function unpublishService(user: SessionUser, serviceId: string) {
  if (!can(user, "publish")) throw new Error("Нет права публикации");
  const editable = await getEditableServiceVersion(serviceId);
  await db
    .update(services)
    .set({ publishedVersionId: null, updatedAt: new Date() })
    .where(eq(services.id, serviceId));
  const keepDraft = editable && editable.status !== "published";
  await db
    .update(serviceVersions)
    .set({
      status: keepDraft ? "archived" : "draft",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(serviceVersions.serviceId, serviceId),
        eq(serviceVersions.status, "published"),
      ),
    );
  const settings = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });
  const featured = (settings?.homeServiceIds || []).filter((id) => id !== serviceId);
  if (settings && featured.length !== (settings.homeServiceIds || []).length) {
    await db
      .update(siteSettings)
      .set({ homeServiceIds: featured, updatedAt: new Date() })
      .where(eq(siteSettings.id, 1));
  }
  revalidatePublic();
}

export async function setHomeFeaturedServices(
  user: SessionUser,
  ids: string[],
) {
  if (!can(user, "publish")) throw new Error("Нет права публикации");
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 2);
  for (const id of unique) {
    const row = await db.query.services.findFirst({
      where: eq(services.id, id),
    });
    if (!row?.publishedVersionId) {
      throw new Error("На главную можно поставить только опубликованную услугу");
    }
  }
  const existing = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });
  if (existing) {
    await db
      .update(siteSettings)
      .set({ homeServiceIds: unique, updatedAt: new Date() })
      .where(eq(siteSettings.id, 1));
  } else {
    await db.insert(siteSettings).values({
      id: 1,
      homeServiceIds: unique,
    });
  }
  revalidatePublic();
  return unique;
}

export async function listPublishedServices() {
  return db
    .select({
      id: services.id,
      title: serviceVersions.title,
    })
    .from(services)
    .innerJoin(
      serviceVersions,
      eq(services.publishedVersionId, serviceVersions.id),
    )
    .orderBy(asc(services.sortOrder));
}

export async function getHomeFeaturedIds() {
  const settings = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });
  return settings?.homeServiceIds || [];
}

async function getEditableServiceVersion(serviceId: string) {
  const draft = await db.query.serviceVersions.findFirst({
    where: and(
      eq(serviceVersions.serviceId, serviceId),
      eq(serviceVersions.status, "draft"),
    ),
    orderBy: [desc(serviceVersions.version)],
  });
  if (draft) return draft;
  const review = await db.query.serviceVersions.findFirst({
    where: and(
      eq(serviceVersions.serviceId, serviceId),
      eq(serviceVersions.status, "review"),
    ),
    orderBy: [desc(serviceVersions.version)],
  });
  if (review) return review;
  return db.query.serviceVersions.findFirst({
    where: and(
      eq(serviceVersions.serviceId, serviceId),
      eq(serviceVersions.status, "published"),
    ),
    orderBy: [desc(serviceVersions.version)],
  });
}

export async function createPropertyDraft(
  user: SessionUser,
  data: {
    title: string;
    address: string;
    dealType: "sale" | "rent";
    placeKind?: "office" | "warehouse" | "retail" | "production" | "other";
    areaSqm: string;
    priceRub: string;
    priceUnit: "total" | "per_month";
    description?: string;
    slug?: string;
    coverId?: string | null;
    galleryIds?: string[];
    floorPlanId?: string | null;
  },
) {
  if (!can(user, "editContent")) throw new Error("Нет права редактирования");
  const title = data.title?.trim() || "";
  const address = data.address?.trim() || "";
  if (!title && !address) throw new Error("Укажите адрес или название");
  const areaSqm = String(data.areaSqm ?? "").trim();
  const priceRub = String(data.priceRub ?? "").trim();
  if (!areaSqm || Number.isNaN(Number(areaSqm))) throw new Error("Укажите площадь");
  if (!priceRub || Number.isNaN(Number(priceRub))) throw new Error("Укажите цену");
  const slugBase = data.slug || slugify(address || title);
  let slug = slugBase;
  let n = 1;
  while (
    await db.query.properties.findFirst({ where: eq(properties.slug, slug) })
  ) {
    slug = `${slugBase}-${++n}`;
  }
  const [property] = await db.insert(properties).values({ slug }).returning();
  const [version] = await db
    .insert(propertyVersions)
    .values({
      propertyId: property.id,
      status: "draft",
      title: title || address,
      address: address || title,
      dealType: data.dealType,
      placeKind: data.placeKind || "other",
      areaSqm,
      priceRub,
      priceUnit: data.priceUnit === "per_month" ? "per_month" : "total",
      description: data.description || "",
      coverId: data.coverId || null,
      galleryIds: data.galleryIds || [],
      floorPlanId: data.floorPlanId || null,
      version: 1,
      createdById: user.id,
    })
    .returning();
  return { property, version };
}

export async function savePropertyVersion(
  user: SessionUser,
  propertyId: string,
  expectedUpdatedAt: string,
  patch: Partial<{
    title: string;
    address: string;
    dealType: "sale" | "rent";
    placeKind: "office" | "warehouse" | "retail" | "production" | "other";
    areaSqm: string;
    priceRub: string;
    priceUnit: "total" | "per_month";
    description: string;
    coverId: string | null;
    galleryIds: string[];
    floorPlanId: string | null;
    status: "draft" | "review";
  }>,
) {
  if (!can(user, "editContent")) throw new Error("Нет права редактирования");
  const current = await getEditablePropertyVersion(propertyId);
  if (!current) throw new Error("Нет версии");

  if (
    expectedUpdatedAt &&
    new Date(current.updatedAt).toISOString() !==
      new Date(expectedUpdatedAt).toISOString()
  ) {
    const err = new Error("VERSION_CONFLICT") as Error & {
      current: typeof current;
    };
    err.current = current;
    throw err;
  }

  if (current.status === "published") {
    const max = await db
      .select({ v: sql<number>`max(${propertyVersions.version})` })
      .from(propertyVersions)
      .where(eq(propertyVersions.propertyId, propertyId));
    const nextVersion = Number(max[0]?.v || current.version) + 1;
    const [created] = await db
      .insert(propertyVersions)
      .values({
        propertyId,
        status: patch.status || "draft",
        title: patch.title ?? current.title,
        address: patch.address ?? current.address,
        dealType: patch.dealType ?? current.dealType,
        placeKind: patch.placeKind ?? current.placeKind,
        areaSqm: patch.areaSqm ?? current.areaSqm,
        priceRub: patch.priceRub ?? current.priceRub,
        priceUnit: patch.priceUnit ?? current.priceUnit,
        description: patch.description ?? current.description,
        coverId: patch.coverId === undefined ? current.coverId : patch.coverId,
        galleryIds: patch.galleryIds ?? current.galleryIds,
        floorPlanId:
          patch.floorPlanId === undefined
            ? current.floorPlanId
            : patch.floorPlanId,
        version: nextVersion,
        createdById: user.id,
      })
      .returning();
    return created;
  }

  const [updated] = await db
    .update(propertyVersions)
    .set({
      title: patch.title ?? current.title,
      address: patch.address ?? current.address,
      dealType: patch.dealType ?? current.dealType,
      placeKind: patch.placeKind ?? current.placeKind,
      areaSqm: patch.areaSqm ?? current.areaSqm,
      priceRub: patch.priceRub ?? current.priceRub,
      priceUnit: patch.priceUnit ?? current.priceUnit,
      description: patch.description ?? current.description,
      coverId: patch.coverId === undefined ? current.coverId : patch.coverId,
      galleryIds: patch.galleryIds ?? current.galleryIds,
      floorPlanId:
        patch.floorPlanId === undefined
          ? current.floorPlanId
          : patch.floorPlanId,
      status: patch.status ?? current.status,
      updatedAt: new Date(),
    })
    .where(eq(propertyVersions.id, current.id))
    .returning();
  return updated;
}

export async function publishProperty(user: SessionUser, propertyId: string) {
  if (!can(user, "publish")) throw new Error("Нет права публикации");
  const draft = await getEditablePropertyVersion(propertyId);
  if (!draft) throw new Error("Нет версии");
  return db.transaction(async (tx) => {
    await tx
      .update(propertyVersions)
      .set({ status: "archived", updatedAt: new Date() })
      .where(
        and(
          eq(propertyVersions.propertyId, propertyId),
          eq(propertyVersions.status, "published"),
        ),
      );
    const [published] = await tx
      .update(propertyVersions)
      .set({
        status: "published",
        publishedAt: new Date(),
        publishedById: user.id,
        updatedAt: new Date(),
      })
      .where(eq(propertyVersions.id, draft.id))
      .returning();
    await tx
      .update(properties)
      .set({ publishedVersionId: published.id, updatedAt: new Date() })
      .where(eq(properties.id, propertyId));
    return published;
  }).then((published) => {
    revalidatePublic();
    return published;
  });
}

export async function unpublishProperty(user: SessionUser, propertyId: string) {
  if (!can(user, "publish")) throw new Error("Нет права публикации");
  await db
    .update(properties)
    .set({ publishedVersionId: null, updatedAt: new Date() })
    .where(eq(properties.id, propertyId));
  await db
    .update(propertyVersions)
    .set({ status: "archived", updatedAt: new Date() })
    .where(
      and(
        eq(propertyVersions.propertyId, propertyId),
        eq(propertyVersions.status, "published"),
      ),
    );
  revalidatePublic();
}

async function getEditablePropertyVersion(propertyId: string) {
  const draft = await db.query.propertyVersions.findFirst({
    where: and(
      eq(propertyVersions.propertyId, propertyId),
      eq(propertyVersions.status, "draft"),
    ),
    orderBy: [desc(propertyVersions.version)],
  });
  if (draft) return draft;
  const review = await db.query.propertyVersions.findFirst({
    where: and(
      eq(propertyVersions.propertyId, propertyId),
      eq(propertyVersions.status, "review"),
    ),
    orderBy: [desc(propertyVersions.version)],
  });
  if (review) return review;
  return db.query.propertyVersions.findFirst({
    where: and(
      eq(propertyVersions.propertyId, propertyId),
      eq(propertyVersions.status, "published"),
    ),
    orderBy: [desc(propertyVersions.version)],
  });
}

export { getEditableServiceVersion, getEditablePropertyVersion };
