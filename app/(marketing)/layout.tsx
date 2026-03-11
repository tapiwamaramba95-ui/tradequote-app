import { Inter } from 'next/font/google'
import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'

const inter = Inter({ subsets: ['latin'] })

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} min-h-screen flex flex-col`}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}