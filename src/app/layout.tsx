import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin', 'greek'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'CampWise - Intelligent Camp Scheduling',
  description: 'Intelligent scheduling platform for camps in Greece',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
