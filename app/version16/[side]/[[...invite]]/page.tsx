import Version16Experience from "@/components/v16/Version16Experience";
import InvalidInvite from "@/components/InvalidInvite";
import { getInvitationEventIds } from "@/lib/invitation-events";

type RouteProps = {
  params: Promise<{ side: string; invite?: string[] }>;
};

export default async function Version16InviteRoute({ params }: RouteProps) {
  const { side, invite } = await params;
  const familyOrder = side === "g" ? "groom" : side === "b" ? "bride" : undefined;
  const code = invite?.join("-") ?? "";
  const eventIds = getInvitationEventIds(code);

  if (!familyOrder || !eventIds) return <InvalidInvite />;
  return <Version16Experience invitation={{ familyOrder, eventIds, inviteCode: code }} />;
}
