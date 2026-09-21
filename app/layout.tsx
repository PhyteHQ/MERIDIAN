import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "MERIDIAN · POB Command",
  description: "Food, Basic Alloy und Consumer Goods für Anchorage in Omicron Delta und Vemork in Pennsylvania. Eine Übersicht für beide Basen.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
