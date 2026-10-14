import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crumb & Crust Studio | Handcrafted Artisan Cakes",
  description: "Browse bespoke cakes and order directly on WhatsApp.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F8F9FA] text-neutral-800 m-0 p-0">
        {children}
      </body>
    </html>
  );
}