import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'
import Link from 'next/link'
import { 
  FileText, 
  CreditCard, 
  ClipboardList, 
  Calendar, 
  Clock, 
  Smartphone,
  CheckCircle,
  X
} from 'lucide-react'

export const metadata = {
  title: 'TradeQuote - Job Management Software for Australian Trade Businesses',
  description: 'Professional job management software for Australian tradies. Track jobs, send quotes & invoices, get paid faster. From $39/month. 14-day free trial.',
  keywords: 'trade software, job management, tradie software, quotes, invoices, Australian trade business software',
  openGraph: {
    title: 'TradeQuote - Job Management for Australian Trade Businesses',
    description: 'Track jobs, send quotes & invoices, get paid faster. Professional software built by Australian tradies.',
    type: 'website',
    url: 'https://tradequote.au',
    images: ['/og-image.jpg'],
    siteName: 'TradeQuote'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TradeQuote - Job Management for Trade Businesses',
    description: 'Professional software for Australian tradies. Track jobs, quotes, invoices. 14-day free trial.',
    images: ['/og-image.jpg']
  }
}

export default function MarketingHomepage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TradeQuote',
    applicationCategory: 'BusinessApplication',
    description: 'Job management software for Australian trade businesses',
    url: 'https://tradequote.au',
    offers: {
      '@type': 'Offer',
      price: '39',
      priceCurrency: 'AUD',
      priceValidUntil: '2025-12-31',
      description: 'Monthly subscription starting at $39 AUD'
    },
    operatingSystem: 'Web, iOS, Android',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127'
    },
    author: {
      '@type': 'Organization',
      name: 'TradeQuote',
      url: 'https://tradequote.au'
    }
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left: Copy */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Job Management for Australian Trade Businesses
              </h1>
              
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Track jobs, send quotes, get paid faster. 
                Works on your phone, not just your computer.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/auth/sign-up"
                  className="px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-lg hover:bg-orange-700 transition-colors text-center"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/pricing"
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:border-gray-400 transition-colors text-center"
                >
                  See Pricing
                </Link>
              </div>
              
              <p className="text-sm text-gray-600 mt-4">
                14-day free trial. No credit card required.
              </p>
            </div>
            
            {/* Right: Image/Screenshot */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-2xl p-6 border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-orange-100 rounded-lg p-8 mb-4">
                  <FileText className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                  <div className="text-gray-700 font-semibold">TradeQuote Dashboard</div>
                  <div className="text-sm text-gray-600 mt-2">Job Management Interface</div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  <div className="bg-white rounded p-3 shadow-sm">
                    <div className="w-full h-2 bg-blue-200 rounded mb-2"></div>
                    <div className="text-xs text-gray-600">Jobs</div>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <div className="w-full h-2 bg-green-200 rounded mb-2"></div>
                    <div className="text-xs text-gray-600">Quotes</div>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <div className="w-full h-2 bg-yellow-200 rounded mb-2"></div>
                    <div className="text-xs text-gray-600">Invoices</div>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <div className="w-full h-2 bg-purple-200 rounded mb-2"></div>
                    <div className="text-xs text-gray-600">Calendar</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Bar */}
      <section className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600 mb-8">
            Trusted by Australian trade businesses
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600 mt-1">Active Tradies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">10,000+</div>
              <div className="text-sm text-gray-600 mt-1">Quotes Sent</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">$2M+</div>
              <div className="text-sm text-gray-600 mt-1">Invoiced</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stop losing quotes in your email
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Most tradies waste hours every week on admin. 
              TradeQuote puts everything in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Problem */}
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-red-600 mb-4">
                <X className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Without TradeQuote
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li>• Quotes lost in email</li>
                <li>• Chasing payments manually</li>
                <li>• Spreadsheets everywhere</li>
                <li>• Can't find job details</li>
                <li>• Unprofessional invoices</li>
              </ul>
            </div>
            
            {/* Solution */}
            <div className="bg-white rounded-xl p-8 border-2 border-orange-600">
              <div className="text-green-600 mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                With TradeQuote
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li>• All quotes in one place</li>
                <li>• Automatic payment reminders</li>
                <li>• Everything organized</li>
                <li>• Access jobs from your phone</li>
                <li>• Professional documents</li>
              </ul>
            </div>
            
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run your business
            </h2>
            <p className="text-xl text-gray-700">
              No complicated features you'll never use. Just what matters.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Quotes & Invoices
              </h3>
              <p className="text-gray-700">
                Professional quotes and invoices in minutes. 
                Track what's sent, viewed, and paid.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Online Payments
              </h3>
              <p className="text-gray-700">
                Get paid faster with card and direct debit. 
                Automatic reminders for overdue invoices.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Job Tracking
              </h3>
              <p className="text-gray-700">
                From enquiry to completion. 
                Know exactly where every job is at.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Schedule & Calendar
              </h3>
              <p className="text-gray-700">
                See your week at a glance. 
                Sync with Google Calendar.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Timesheets
              </h3>
              <p className="text-gray-700">
                Track time on jobs. Know exactly how long things take.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mobile App
              </h3>
              <p className="text-gray-700">
                Access everything from your phone. 
                Works on site, in the ute, anywhere.
              </p>
            </div>
            
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/features" 
              className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
            >
              See all features →
            </Link>
          </div>
          
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get started in minutes
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Sign up free
              </h3>
              <p className="text-gray-700">
                No credit card required. 
                14-day trial on any plan.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Add your details
              </h3>
              <p className="text-gray-700">
                Business name, logo, ABN. 
                Takes 5 minutes.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Start sending quotes
              </h3>
              <p className="text-gray-700">
                Professional quotes from day one. 
                Get paid faster.
              </p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple pricing for trade businesses
            </h2>
            <p className="text-xl text-gray-700">
              Three plans. All features unlock as you grow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Starter */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                $39<span className="text-lg text-gray-600">/month</span>
              </div>
              <p className="text-gray-700 mb-6">Perfect for solo tradies</p>
              <ul className="space-y-3 text-gray-700 mb-8">
                <li>✓ Unlimited jobs & quotes</li>
                <li>✓ 1 user</li>
                <li>✓ Mobile app</li>
                <li>✓ Email support</li>
              </ul>
              <Link
                href="/auth/sign-up"
                className="w-full inline-block text-center px-6 py-3 border-2 border-orange-600 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
            
            {/* Professional */}
            <div className="bg-white rounded-xl border-2 border-orange-600 p-8 relative">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                POPULAR
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                $49<span className="text-lg text-gray-600">/month</span>
              </div>
              <p className="text-gray-700 mb-6">For small teams</p>
              <ul className="space-y-3 text-gray-700 mb-8">
                <li>✓ Everything in Starter</li>
                <li>✓ Up to 5 staff</li>
                <li>✓ Timesheets & tracking</li>
                <li>✓ Online payments</li>
              </ul>
              <Link
                href="/auth/sign-up"
                className="w-full inline-block text-center px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
            
            {/* Business */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Business</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                $89<span className="text-lg text-gray-600">/month</span>
              </div>
              <p className="text-gray-700 mb-6">For growing businesses</p>
              <ul className="space-y-3 text-gray-700 mb-8">
                <li>✓ Everything in Professional</li>
                <li>✓ Unlimited staff</li>
                <li>✓ Custom branding</li>
                <li>✓ Advanced reporting</li>
              </ul>
              <Link
                href="/auth/sign-up"
                className="w-full inline-block text-center px-6 py-3 border-2 border-orange-600 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
            
          </div>
          
          <div className="text-center mt-8">
            <Link 
              href="/pricing" 
              className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
            >
              See full pricing details →
            </Link>
          </div>
          
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-[#2d3748] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of Australian tradies already using TradeQuote.
            14-day free trial. No credit card required.
          </p>
          
          <Link
            href="/auth/sign-up"
            className="inline-block px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-lg hover:bg-orange-700 transition-colors"
          >
            Start Free Trial
          </Link>
          
          <p className="text-sm text-gray-400 mt-4">
            Questions? Email support@tradequote.com.au
          </p>
          
        </div>
      </section>

      <Footer />
    </div>
  )
}