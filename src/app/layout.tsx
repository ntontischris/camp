import type { Metadata } from 'next';
import { Toaster } from 'sonner';
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
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            },
            className: 'font-sans',
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
