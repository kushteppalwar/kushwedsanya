import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getEventConfig,
  getEventMeta,
  getDirectionsUrl,
  eventSlugs,
} from "@/lib/content";
import { buildCalendarHref } from "@/lib/calendar";
import AncientScroll from "@/components/sections/AncientScroll";

interface PageProps {
  params: Promise<{ event: string }>;
}

export function generateStaticParams() {
  return eventSlugs.map((event) => ({ event }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { event } = await params;
  const config = getEventConfig(event);
  if (!config) return {};

  const meta = getEventMeta(config);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { event } = await params;
  const config = getEventConfig(event);

  if (!config) notFound();

  return (
    <main className="relative">
      <AncientScroll
        tagline={config.weddingDate.tagline}
        partner1={config.couple.partner1}
        partner2={config.couple.partner2}
        dateDisplay={config.weddingDate.display}
        schedule={config.schedule}
        location={config.location}
        directionsUrl={getDirectionsUrl(config.location)}
        calendarHref={buildCalendarHref(config)}
        calendarFileName={`${config.couple.partner1}-${config.couple.partner2}-${config.eventName}.ics`.toLowerCase()}
        closing={config.closing}
      />
    </main>
  );
}
