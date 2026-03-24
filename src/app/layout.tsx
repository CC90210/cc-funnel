import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CC McKenna — Free Resources",
  description:
    "Get a free AI audit, DJ booking, or brand strategy session from Conaugh McKenna.",
  openGraph: {
    title: "CC McKenna — Free Resources",
    description:
      "AI automation, music, and personal brand — pick what interests you and get something free.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CC McKenna — Free Resources",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CC McKenna — Free Resources",
    description:
      "AI automation, music, and personal brand — pick what interests you and get something free.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
