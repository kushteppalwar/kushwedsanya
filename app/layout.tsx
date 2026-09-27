import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Great_Vibes } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kushwedsanya.vercel.app"),
  title: "Sanya & Kush — Wedding Invitation",
  description: "You are invited to celebrate the wedding of Sanya & Kush.",
  openGraph: {
    type: "website",
    title: "Sanya & Kush — Wedding Invitation",
    description: "You are invited to celebrate the wedding of Sanya & Kush.",
    images: [
      {
        url: "/v15-2/kush-sanya-wedding-logo.jpeg",
        width: 1254,
        height: 1254,
        alt: "Kush and Sanya’s wedding logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/v15-2/kush-sanya-wedding-logo.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${cormorant.variable} ${greatVibes.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
