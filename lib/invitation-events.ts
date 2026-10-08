export type InvitationEventId = "mandap-puja" | "sakharpuda" | "sangeet" | "haldi" | "shadi" | "reception";

const eventSets: Record<string, InvitationEventId[]> = {
  "sk-sg-hw-we-re": ["sakharpuda", "sangeet", "haldi", "shadi", "reception"],
  "sk-sg-hw-we": ["sakharpuda", "sangeet", "haldi", "shadi"],
  "sg-we": ["sangeet", "shadi"],
  "sk-sg-hw-re": ["sakharpuda", "sangeet", "haldi", "reception"],
  re: ["reception"],
  we: ["shadi"],
};

export function getInvitationEventIds(code: string): InvitationEventId[] | null {
  const includesMandapPuja = code === "mp" || code.startsWith("mp-");
  const baseCode = code === "mp" ? "" : includesMandapPuja ? code.slice(3) : code;
  const configuredEvents = eventSets[baseCode];

  if (code === "mp") return ["mandap-puja"];
  if (configuredEvents && includesMandapPuja) return ["mandap-puja", ...configuredEvents];
  return configuredEvents ?? null;
}
