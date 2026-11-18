import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  properties,
  propertyVersions,
  services,
  serviceVersions,
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
    workItems?: { id: string; text: string }[];
    imageId?: string | null;
  },
) {
  if (!can(user, "editContent")) throw new Error("Нет права редактирования");
  const slugBase = data.slug || slugify(data.title);
  let slug = slugBase;
  let n = 1;
  while (await db.query.services.findFirst({ where: eq(services.slug, slug) })) {
    slug = `${slugBase}-${++n}`;
  }
  const [service] = await db
    .insert(services)
    .values({ slug, sortOrder: Date.now() % 100000 })
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
    shortDescription: string;
    fullDescription: string;
    workItems: { id: string; text: string }[];
    imageId: string | null;
    status: "draft" | "review";
  }>,
) {
  if (!can(user, "editContent")) throw new Error("Нет права редактирования");
  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
  });
  if (!service) throw new Error("Услуга не найдена");

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
  await db
    .update(services)
    .set({ publishedVersionId: null, updatedAt: new Date() })
    .where(eq(services.id, serviceId));
  await db
    .update(serviceVersions)
    .set({ status: "archived", updatedAt: new Date() })
    .where(
      and(
        eq(serviceVersions.serviceId, serviceId),
        eq(serviceVersions.status, "published"),
      ),
    );
  revalidatePublic();
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
  const slugBase = data.slug || slugify(data.address || data.title);
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
      title: data.title,
      address: data.address,
      dealType: data.dealType,
      areaSqm: data.areaSqm,
      priceRub: data.priceRub,
      priceUnit: data.priceUnit,
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
