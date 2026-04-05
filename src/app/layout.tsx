import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLACKOUT EXCHANGE",
  description: "Leaderless Emergency Agent Economy",
  icons: {
    icon: "/blackout-logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
