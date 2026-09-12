import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEventConfig, getEventMeta, eventSlugs } from "@/lib/content";
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
    <main className="relative overflow-hidden">
      <AncientScroll
        tagline={config.weddingDate.tagline}
        partner1={config.couple.partner1}
        partner2={config.couple.partner2}
        dateDisplay={config.weddingDate.display}
        city1={config.couple.partner1City}
        city2={config.couple.partner2City}
        location={config.location}
        closing={config.closing}
      />
    </main>
  );
}
