export const siteVersions = [
  {
    href: "/version14",
    label: "Ivory garden",
    description:
      "A gate that parts on a tap, then a walk through arched garden scenes — welcome, the couple, each ceremony, RSVP — in the style of the premium digital-invitation sites, drawn in this project's own line art.",
  },
  {
    href: "/version2",
    label: "Classic card",
    description:
      "A framed invitation card with gold sprigs, a mandala monogram, script names and drifting petals.",
  },
  {
    href: "/version3",
    label: "Journey map",
    description:
      "Vintage cartography: the Pune → Delhi route drawn on an aged-paper map with real coordinates.",
  },
  {
    href: "/version4",
    label: "3D flyover",
    description:
      "A low-poly night scene where a plane, train or car travels between the two cities.",
  },
  {
    href: "/version4-1",
    label: "3D world round trip",
    description:
      "Version 13's whole journey — intro, every leg, wedding and reception stops, live countdown — flown as a scroll-driven three.js night flyover over a low-poly map.",
  },
  {
    href: "/version4-2",
    label: "3D world · explore",
    description:
      "Version 4.1's journey as seven free-roaming worlds: drag to look around, watch the plane, train or car make the trip, and step between stops with an always-visible Next button.",
  },
  {
    href: "/version5",
    label: "Boarding pass",
    description:
      "Travel documents: a PNQ → DEL boarding pass, passport stamps for each ceremony, and a postcard.",
  },
  {
    href: "/version6",
    label: "Scroll atlas",
    description:
      "The map stays pinned while scrolling draws the route and flies the plane from stop to stop.",
  },
  {
    href: "/version7",
    label: "All roads to Delhi",
    description:
      "Many-to-one atlas: Kush's route from Pune, then routes from guests' cities across India converging on the venue.",
  },
  {
    href: "/version8",
    label: "World round trip",
    description:
      "Kush sets out from Pune, guests converge from across India and the world, then the route turns home for the reception.",
  },
  {
    href: "/version10",
    label: "World round trip · mobile",
    description:
      "Version 8 tuned for phones — smoothed scrolling, lighter cards — plus a route-style timeline of every event.",
  },
  {
    href: "/version11",
    label: "World round trip · calm",
    description:
      "Version 10 with one steady world view for the overseas leg and the inbound routes faded right down for the homeward flight.",
  },
  {
    href: "/version12",
    label: "World round trip · attire",
    description:
      "Version 11 with the final event names, halls and timings, and a subtle optional-attire note on every stop.",
  },
  {
    href: "/version13",
    label: "World round trip · readable",
    description:
      "Version 12 with a full-screen intro that dissolves into the map, larger phone-friendly type, previous/next stop buttons, a longer wedding stop and a live countdown to the ceremony.",
  },
  {
    href: "/version9",
    label: "Round trip",
    description:
      "Everyone converges on Delhi for the wedding, then the route turns back to Pune for the reception.",
  },
  {
    href: "/version1",
    label: "Editorial",
    description:
      "Big asymmetric type, a rotating ring around the ampersand, and a timeline that draws as you scroll.",
  },
  {
    href: "/scroll",
    label: "Parchment scroll",
    description:
      "A sealed parchment that unrolls as you scroll down and rolls back up as you scroll up.",
  },
];

export function otherVersions(current: string) {
  return siteVersions.filter((version) => version.href !== current);
}
