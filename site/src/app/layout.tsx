import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-url'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'PET EEL', template: '%s · PET EEL' },
  description: 'Programa de Educação Tutorial de Engenharia Elétrica — UFSC',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
