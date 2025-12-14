import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { LanguageProvider } from "@/components/language-provider"
import GoogleTranslate from "@/components/google-translate"
import ChatWidget from "@/components/chat-widget"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
// ... metadata ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          {children}
          <ChatWidget />
        </LanguageProvider>
        <GoogleTranslate />
        <Analytics />
      </body>
    </html>
  )
}
