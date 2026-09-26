import Version15Page, { type InvitationOptions } from "../../version15-1/page";
import InvalidInvite from "@/components/InvalidInvite";

type RouteProps = {
  params: Promise<{ side: string; invite?: string[] }>;
};

const eventSets: Record<string, NonNullable<InvitationOptions["eventIds"]>> = {
  "sk-sg-hw-we-re": ["sakharpuda", "sangeet", "haldi", "shadi", "reception"],
  "sk-sg-hw-we": ["sakharpuda", "sangeet", "haldi", "shadi"],
  "sg-we": ["sangeet", "shadi"],
  "sk-sg-hw-re": ["sakharpuda", "sangeet", "haldi", "reception"],
};

export default async function InviteRoute({ params }: RouteProps) {
  const { side, invite } = await params;
  const familyOrder = side === "g" ? "groom" : side === "b" ? "bride" : undefined;
  const code = invite?.join("-") ?? "";
  const eventIds = eventSets[code];

  if (!familyOrder || !eventIds) return <InvalidInvite />;

  return <Version15Page invitation={{ familyOrder, eventIds }} />;
}
