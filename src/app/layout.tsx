import type { Metadata } from 'next';
import { Newsreader, Sora, Spline_Sans_Mono } from 'next/font/google';

import '@/styles/globals.css';

/**
 * Typography — wired once here via next/font and exposed as CSS vars.
 *
 *  - Sora .............. UI + display figures   → --font-sora (Tailwind font-sans)
 *  - Spline Sans Mono .. ALL metadata/labels    → --font-mono (Tailwind font-mono)
 *  - Newsreader ........ scripture/verse ONLY    → --font-serif (Tailwind font-serif)
 *
 * These are the ONLY families loaded. The var names match the design.md
 * contract and the @theme mapping in globals.css.
 */
const sora = Sora({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-sora',
});

const splineSansMono = Spline_Sans_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['italic'],
  display: 'swap',
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'C.O.O.P.',
  description: 'Cognitive Operations & Optimization Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${splineSansMono.variable} ${newsreader.variable}`}
    >
      <body className="font-sans font-light">{children}</body>
    </html>
  );
}
