import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Providers from "./providers"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "GrowWave — Your Social Media Workspace",
  description:
    "Share consistently without the chaos. Manage all your social media accounts from one powerful platform.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-background text-muted-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
