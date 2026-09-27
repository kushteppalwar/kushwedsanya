import Version15Page from "./version15-2/page";

export default function Home() {
  return (
    <Version15Page
      invitation={{
        familyOrder: "groom",
        eventIds: ["sakharpuda", "sangeet", "haldi", "shadi", "reception"],
      }}
    />
  );
}
