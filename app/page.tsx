import { redirect } from 'next/navigation'

export const metadata = {
  title: 'TradeQuote - Job Management for Australian Trade Businesses',
  description: 'Professional job management software for Australian tradies. Track jobs, send quotes, get paid faster. $39/month. 14-day free trial.',
  keywords: 'trade software, job management, tradie software, quotes, invoices, Australian, plumber software, electrician software',
  openGraph: {
    title: 'TradeQuote - Job Management for Trade Businesses',
    description: 'Track jobs, send quotes, get paid faster. Professional software for Australian trade businesses.',
    images: ['/og-image.jpg'],
  },
  robots: 'index, follow'
}

export default function Home() {
  // Always redirect to marketing homepage
  redirect('/marketing')
}
