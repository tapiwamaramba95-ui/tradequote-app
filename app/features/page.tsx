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
  Users,
  Camera,
  BarChart3,
  Mail,
  CheckCircle
} from 'lucide-react'

export const metadata = {
  title: 'Features - TradeQuote',
  description: 'Complete feature list for TradeQuote job management software. Quotes, invoices, online payments, job tracking, timesheets, and more.',
}

export default function FeaturesPage() {
  const features = [
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Customer Enquiries",
      description: "Public enquiry forms that customers can fill out. Get qualified leads automatically organized in your dashboard.",
      benefits: [
        "24/7 lead capture",
        "Qualified enquiry forms",
        "Automatic organization",
        "Follow-up reminders"
      ],
      image: null
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Professional Quotes & Invoices",
      description: "Create professional quotes and invoices in minutes. Track what's been sent, viewed, and paid.",
      benefits: [
        "Professional branding",
        "Automatic calculations",
        "PDF generation",
        "Status tracking"
      ],
      image: null
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Online Payments (Stripe)",
      description: "Get paid faster with online payments. Accept credit cards, direct debit, and send automatic reminders.",
      benefits: [
        "Faster payment collection",
        "Automated reminders",
        "Secure payment processing",
        "Reduced admin time"
      ],
      image: null
    },
    {
      icon: <ClipboardList className="w-8 h-8" />,
      title: "Complete Job Tracking",
      description: "Track every job from enquiry to completion. See exactly where each project stands.",
      benefits: [
        "Visual job pipeline",
        "Status updates",
        "Progress tracking",
        "Client communication"
      ],
      image: null
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Schedule & Calendar",
      description: "See your week at a glance. Schedule jobs, appointments, and sync with Google Calendar.",
      benefits: [
        "Visual scheduling",
        "Google Calendar sync",
        "Conflict prevention",
        "Team coordination"
      ],
      image: null
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Time Tracking & Timesheets",
      description: "Track time spent on jobs. Know exactly how long projects take and improve your estimates.",
      benefits: [
        "Accurate time tracking",
        "Better job costing",
        "Improved estimates",
        "Staff productivity"
      ],
      image: null
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Client Management",
      description: "Keep all client information organized. Contact details, job history, and communication in one place.",
      benefits: [
        "Centralized contacts",
        "Job history tracking",
        "Communication logs",
        "Quick access"
      ],
      image: null
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Photo & File Uploads",
      description: "Upload photos and documents to jobs. Before, during, and after photos help document your work.",
      benefits: [
        "Visual documentation",
        "Proof of work",
        "Easy file sharing",
        "Organized storage"
      ],
      image: null
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile App",
      description: "Access everything from your phone. Works on site, in the van, anywhere you need it.",
      benefits: [
        "On-site access",
        "Real-time updates",
        "Works offline",
        "Easy photo capture"
      ],
      image: null
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Reports & Analytics",
      description: "See how your business is performing. Revenue tracking, job profitability, and growth insights.",
      benefits: [
        "Revenue tracking",
        "Profit analysis",
        "Growth insights",
        "Business intelligence"
      ],
      image: null
    }
  ]

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything you need to run your trade business
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-8">
              Professional software designed specifically for Australian trade businesses. 
              Simple enough to use on site. Powerful enough to run your business.
            </p>
            <Link 
              href="/auth/sign-up"
              className="inline-block px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'md:grid-flow-col-dense' : ''
                }`}
              >
                {/* Content */}
                <div className={index % 2 === 1 ? 'md:col-start-2' : ''}>
                  <div className="w-16 h-16 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
                    <div className="text-orange-500">
                      {feature.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-lg text-gray-200 mb-6">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-gray-300">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Image */}
                <div className={`${index % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}`}>
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700 p-8 flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500/10 rounded-xl mb-6">
                        <div className="text-orange-500">
                          {feature.icon}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <div className="space-y-2">
                        {feature.benefits.slice(0, 3).map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-700">
                            <div className="flex items-center text-sm text-gray-300">
                              <CheckCircle className="w-4 h-4 text-orange-500 mr-2" />
                              {benefit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Features by plan
            </h2>
            <p className="text-xl text-gray-200">
              All features unlock as your business grows
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-white">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-white">Starter</th>
                    <th className="px-6 py-4 text-center font-semibold text-white">Professional</th>
                    <th className="px-6 py-4 text-center font-semibold text-white">Business</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[
                    { feature: "Quotes & Invoices", starter: true, professional: true, business: true },
                    { feature: "Job Tracking", starter: true, professional: true, business: true },
                    { feature: "Client Management", starter: true, professional: true, business: true },
                    { feature: "Mobile App", starter: true, professional: true, business: true },
                    { feature: "Users", starter: "1", professional: "5", business: "Unlimited" },
                    { feature: "Timesheets & Time Tracking", starter: false, professional: true, business: true },
                    { feature: "Online Payments (Stripe)", starter: false, professional: true, business: true },
                    { feature: "Schedule & Calendar", starter: false, professional: true, business: true },
                    { feature: "Purchase Orders", starter: false, professional: true, business: true },
                    { feature: "Analytics & Reports", starter: false, professional: true, business: true },
                    { feature: "Google Calendar Sync", starter: false, professional: true, business: true },
                    { feature: "Custom Branding", starter: false, professional: false, business: true },
                    { feature: "Advanced Reporting", starter: false, professional: false, business: true },
                    { feature: "Multi-location Support", starter: false, professional: false, business: true },
                    { feature: "API Access", starter: false, professional: false, business: true },
                    { feature: "Priority Support", starter: false, professional: true, business: true },
                  ].map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 font-medium text-gray-200">{row.feature}</td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? <span className="text-orange-500">✓</span> : <span className="text-gray-600">-</span>
                        ) : (
                          <span className="text-gray-200">{row.starter}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.professional === 'boolean' ? (
                          row.professional ? <span className="text-orange-500">✓</span> : <span className="text-gray-600">-</span>
                        ) : (
                          <span className="text-gray-200">{row.professional}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.business === 'boolean' ? (
                          row.business ? <span className="text-orange-500">✓</span> : <span className="text-gray-600">-</span>
                        ) : (
                          <span className="text-gray-200">{row.business}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/pricing" 
              className="inline-block px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}