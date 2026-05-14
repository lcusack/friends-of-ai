import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fredoka } from "next/font/google";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const display = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Friends of AI · A registry of verified humans",
  description:
    "A playful proof-of-human ritual for AI chats. Verify with World ID, get a Human Receipt, paste it back into the chat, continue the chain.",
  openGraph: {
    title: "Friends of AI",
    description:
      "A playful proof-of-human ritual for AI chats. Verified humans only. ともだち.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
