import type { Metadata } from "next";
import { Caveat, Permanent_Marker, Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

const caveat = Caveat({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
})

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-permanent-marker',
})

export const metadata: Metadata = {
  title: "时光照相馆",
  description: "时光照相馆",
  keywords: ['Nano Banana', 'Nano Banana AI', 'Nano Banana Image', 'Nano Banana Image Generation', '时光照相馆'],
  authors: [{ name: "ayden", url: "https://aydengen.com" }],
  openGraph: {
    title: "时光照相馆",
    description: "时光照相馆",
    type: "website",
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
        className={`${roboto.variable} ${caveat.variable} ${permanentMarker.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
