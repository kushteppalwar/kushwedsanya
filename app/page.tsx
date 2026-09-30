import Version16Experience, { type Version16Invitation } from "@/components/v16/Version16Experience";

export { metadata } from "./version16/page";

const mainInvitation: Version16Invitation = {
  familyOrder: "groom",
  eventIds: ["mandap-puja", "sakharpuda", "sangeet", "haldi", "shadi", "reception"],
  navigationEnabled: true,
  backgroundMusic: true,
};

export default function HomePage() {
  return <Version16Experience invitation={mainInvitation} />;
}
