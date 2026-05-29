import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'u-bike Admin',
  description: 'u-bike Platform Administration',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-[#F5FAFF] text-[#0A1A3E]">
        {children}
      </body>
    </html>
  );
}
