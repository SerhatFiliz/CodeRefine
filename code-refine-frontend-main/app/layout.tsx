import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aurora Auth',
  description: 'A beautiful glassmorphism authentication system with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Animated gradient background */}
        <div className="gradient-bg"></div>
        
        {/* Floating orbs */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        
        {/* Main content */}
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  )
}

