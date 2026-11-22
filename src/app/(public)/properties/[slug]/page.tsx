import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { InquiryChat } from "@/components/public/InquiryChat";
import { demoPropertyBySlug } from "@/lib/content/demo-catalog";
import { asPlaceKind, placeKindLabel } from "@/lib/content/kinds";
import { listPublicChannelStatus } from "@/lib/channels";
import { getPropertyCards, getPublishedProperty } from "@/lib/public/cache";
import { formatArea, formatRub } from "@/lib/utils";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getPropertyCards("all", "", "");
  return items.map((item) => ({ slug: item.slug }));
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead?: string }>;
}) {
  const { slug } = await params;
  const published = await getPublishedProperty(slug);
  const demo = demoPropertyBySlug(slug);
  const property = published ?? (demo
    ? {
        id: demo.slug,
        slug: demo.slug,
        title: demo.title,
        address: demo.address,
        dealType: demo.dealType,
        placeKind: demo.placeKind,
        areaSqm: demo.areaSqm,
        priceRub: demo.priceRub,
        priceUnit: demo.priceUnit,
        description: demo.description,
        coverId: null as string | null,
        galleryIds: [] as string[],
        floorPlanId: null as string | null,
      }
    : null);
  if (!property) notFound();
  const query = await searchParams;
  const notice = query.lead === "ok" || query.lead === "error" ? query.lead : undefined;
  const channelStatus = listPublicChannelStatus();
  const photos = [property.coverId, ...(property.galleryIds || [])].filter(
    (id, index, list): id is string => Boolean(id) && list.indexOf(id) === index,
  );

  return (
    <div className="pb-28 pt-4">
      <div className="grid gap-8 md:grid-cols-2">
      <div className="reveal">
        {photos.length > 0 ? (
          <div className="mb-5 grid gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/media/${photos[0]}`}
              alt=""
              className="h-48 w-full rounded-[24px] object-cover sm:h-64"
            />
            {photos.length > 1 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(1).map((id) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={id}
                    src={`/api/media/${id}`}
                    alt=""
                    className="h-24 w-full rounded-2xl object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mb-3 text-sm font-semibold text-ink/50">
          {placeKindLabel[asPlaceKind(property.placeKind)]}
        </div>
        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${
            property.dealType === "sale" ? "bg-brand-red" : "bg-brand-blue"
          }`}
        >
          {property.dealType === "sale" ? "Продажа" : "Аренда"}
        </div>
        <h1 className="mt-3 break-words font-display text-[clamp(1.85rem,6vw,2.5rem)] font-bold text-ink">
          {property.title}
        </h1>
        <p className="mt-2 text-base text-ink/70 sm:text-lg">{property.address}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-ink">
          <span>{formatArea(property.areaSqm)}</span>
          <span className="font-semibold">
            {formatRub(property.priceRub, property.priceUnit)}
          </span>
        </div>
        <p className="mt-6 whitespace-pre-wrap text-ink/80">
          {property.description}
        </p>
        {property.floorPlanId && (
          <Link
            href={`/api/media/${property.floorPlanId}`}
            className="btn-ghost mt-4"
          >
            Планировка
          </Link>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href="#ask" className="btn-primary w-full sm:w-auto">
            Задать вопрос
          </a>
          <a href="#viewing" className="btn-ghost w-full sm:w-auto">
            Записаться на просмотр
          </a>
        </div>
      </div>
      <div className="space-y-6">
        <div id="ask">
          <DiscussForm
            className="reveal reveal-delay-2"
            propertyId={published?.id}
            intent="question"
            sourcePage={`/properties/${property.slug}`}
            title="Задать вопрос"
            variant="compact"
            channelStatus={channelStatus}
            notice={notice}
            actionLabel="Задать вопрос"
          />
        </div>
        <div id="viewing">
          <DiscussForm
            className="reveal reveal-delay-3"
            propertyId={published?.id}
            intent="viewing"
            sourcePage={`/properties/${property.slug}`}
            title="Записаться на просмотр"
            variant="compact"
            channelStatus={channelStatus}
            actionLabel="Записаться"
          />
        </div>
      </div>
      </div>
      <InquiryChat
        topic={property.title}
        sourcePage={`/properties/${property.slug}`}
        propertyId={published?.id}
        channelStatus={channelStatus}
        placement="left"
      />
    </div>
  );
}
