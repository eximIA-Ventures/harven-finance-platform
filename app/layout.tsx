import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Harven Finance Platform",
  description: "Plataforma de gestão interna da Liga de Mercado Financeiro",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Apply light mode before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var theme = localStorage.getItem('hv-theme');
            if (theme !== 'dark') {
              document.documentElement.querySelector('body') ||
              document.addEventListener('DOMContentLoaded', function() {
                document.body.classList.add('light');
              });
            }
          })();
        `}} />
      </head>
      <body className="min-h-screen font-sans antialiased light">{children}</body>
    </html>
  );
}
