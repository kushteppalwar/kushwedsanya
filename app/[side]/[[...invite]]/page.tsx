import Version15Page, { type InvitationOptions } from "../../version15-1/page";

type RouteProps = {
  params: Promise<{ side: string; invite?: string[] }>;
};

const eventSets: Record<string, NonNullable<InvitationOptions["eventIds"]>> = {
  "sk-sg-hw-we-re": ["sakharpuda", "sangeet", "haldi", "shadi", "reception"],
  "sk-sg-hw-we": ["sakharpuda", "sangeet", "haldi", "shadi"],
  "sg-we": ["sangeet", "shadi"],
  "sk-sg-hw-re": ["sakharpuda", "sangeet", "haldi", "reception"],
};

function InvalidInvite() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f7f0e5] px-6 py-12 text-[#573e2b]">
      <section className="w-full max-w-lg border border-[#b5863d]/70 bg-[#fffaf1] px-8 py-12 text-center shadow-xl sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c6735]">Kush &amp; Sanya</p>
        <h1 className="mt-5 font-serif text-3xl sm:text-4xl">This invitation link isn’t valid</h1>
        <p className="mt-4 text-base leading-relaxed">
          Please ask the person who shared it with you to send the correct URL.
        </p>
      </section>
    </main>
  );
}

export default async function InviteRoute({ params }: RouteProps) {
  const { side, invite } = await params;
  const familyOrder = side === "g" ? "groom" : side === "b" ? "bride" : undefined;
  const code = invite?.join("-") ?? "";
  const eventIds = eventSets[code];

  if (!familyOrder || !eventIds) return <InvalidInvite />;

  return <Version15Page invitation={{ familyOrder, eventIds }} />;
}
