import type { Metadata } from "next";
import Version16Experience, { type Version16Invitation } from "@/components/v16/Version16Experience";

export const metadata: Metadata = {
  title: "Kush & Sanya — A Journey Through Our Celebrations",
  description: "A wedding invitation told through a journey from Pune to Delhi and back.",
};

const defaultInvitation: Version16Invitation = {
  familyOrder: "groom",
  eventIds: ["mandap-puja", "sakharpuda", "sangeet", "haldi", "shadi", "reception"],
};

export default function Version16() {
  return <Version16Experience invitation={defaultInvitation} />;
}
