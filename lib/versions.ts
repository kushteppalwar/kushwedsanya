export const siteVersions = [
  { href: "/version2", label: "Classic card" },
  { href: "/version3", label: "Journey map" },
  { href: "/version4", label: "3D flyover" },
  { href: "/version5", label: "Boarding pass" },
  { href: "/version6", label: "Scroll atlas" },
  { href: "/version1", label: "Editorial" },
  { href: "/scroll", label: "Parchment scroll" },
];

export function otherVersions(current: string) {
  return siteVersions.filter((version) => version.href !== current);
}
