import Version16Experience, { type Version16Invitation } from "@/components/v16/Version16Experience";
import InvalidInvite from "@/components/InvalidInvite";

type RouteProps = {
  params: Promise<{ side: string; invite?: string[] }>;
};

const eventSets: Record<string, NonNullable<Version16Invitation["eventIds"]>> = {
  "sk-sg-hw-we-re": ["sakharpuda", "sangeet", "haldi", "shadi", "reception"],
  "sk-sg-hw-we": ["sakharpuda", "sangeet", "haldi", "shadi"],
  "sg-we": ["sangeet", "shadi"],
  "sk-sg-hw-re": ["sakharpuda", "sangeet", "haldi", "reception"],
  re: ["reception"],
  we: ["shadi"],
};

export default async function Version16InviteRoute({ params }: RouteProps) {
  const { side, invite } = await params;
  const familyOrder = side === "g" ? "groom" : side === "b" ? "bride" : undefined;
  const code = invite?.join("-") ?? "";
  const includesMandapPuja = code === "mp" || code.startsWith("mp-");
  const baseCode = code === "mp" ? "" : includesMandapPuja ? code.slice(3) : code;
  const configuredEvents = eventSets[baseCode];
  const eventIds: NonNullable<Version16Invitation["eventIds"]> | undefined = code === "mp"
    ? ["mandap-puja"]
    : configuredEvents && includesMandapPuja
      ? ["mandap-puja", ...configuredEvents]
      : configuredEvents;

  if (!familyOrder || !eventIds) return <InvalidInvite />;
  return <Version16Experience invitation={{ familyOrder, eventIds }} />;
}
