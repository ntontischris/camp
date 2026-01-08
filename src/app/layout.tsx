import type { Metadata } from 'next';
import '@/styles/globals.css';

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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
