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
  title: "Nano Banana",
  description: "Nano Banana",
  keywords: ['Nano Banana', 'Nano Banana AI', 'Nano Banana Image', 'Nano Banana Image Generation'],
  authors: [{ name: "Ayden", url: "https://aydengen.com" }],
  openGraph: {
    title: "Nano Banana",
    description: "Nano Banana",
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
