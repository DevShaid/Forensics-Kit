import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import IPMonitorInitializer from '@/components/IPMonitorInitializer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Application Form',
  description: 'Submit your application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <IPMonitorInitializer />
        {children}
      </body>
    </html>
  )
}
