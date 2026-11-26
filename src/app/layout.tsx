import type { Metadata } from "next";
import { Poppins, Montserrat } from "next/font/google";
const poppins = Poppins({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin", "vietnamese"], weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], variable: "--font-heading", display: "swap" });
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import SiteChrome from "@/components/SiteChrome";
import CartDrawer from "@/components/CartDrawer";
export const metadata: Metadata = { title: "Fashion Store — Bộ sưu tập Mùa xuân", description: "Fashion Store - Cửa hàng thời trang trực tuyến", icons: { icon: "/icon.png" } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={`${poppins.variable} ${montserrat.variable}`}><LanguageProvider><AuthProvider><AdminAuthProvider><CartProvider>
    <SiteChrome>{children}</SiteChrome><CartDrawer />
  </CartProvider></AdminAuthProvider></AuthProvider></LanguageProvider></body></html>);
}
