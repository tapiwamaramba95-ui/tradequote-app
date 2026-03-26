import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'
import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata = {
  title: 'Pricing - TradeQuote',
  description: 'Simple, transparent pricing for TradeQuote. Starter $39/month, Professional $49/month, Business $89/month. 14-day free trial.',
}

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: 39,
      description: "Perfect for solo tradies just getting started",
      features: [
        "Unlimited jobs, quotes & invoices",
        "1 user (solo tradie)",
        "Client management",
        "Basic scheduler/calendar", 
        "Mobile app",
        "Email support"
      ],
      highlight: false,
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      price: 49,
      description: "For tradies with a small team",
      features: [
        "Everything in Starter",
        "Up to 5 staff members",
        "Timesheets & time tracking",
        "Purchase orders & suppliers",
        "Analytics & reports",
        "Google Calendar sync",
        "Stripe payments (optional)",
        "Priority support"
      ],
      highlight: true,
      cta: "Start Free Trial"
    },
    {
      name: "Business",
      price: 89,
      description: "For growing businesses with multiple crews",
      features: [
        "Everything in Professional",
        "Unlimited staff",
        "Custom branding (logo on docs)",
        "Advanced reporting",
        "Multi-location support",
        "API access",
        "Dedicated account manager",
        "Priority support"
      ],
      highlight: false,
      cta: "Start Free Trial"
    }
  ]

  const faqs = [
    {
      question: "Is there a free trial?",
      answer: "Yes! Every plan comes with a 14-day free trial. No credit card required. You get full access to test all features."
    },
    {
      question: "Can I change plans later?",
      answer: "Absolutely. You can upgrade or downgrade at any time. Changes take effect immediately and we'll pro-rate your billing."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, Amex) and direct debit from Australian bank accounts."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees, no hidden costs. The price you see is what you pay - simple and transparent."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel anytime. No lock-in contracts. If you cancel, you'll have access until the end of your billing period."
    },
    {
      question: "Do you offer annual billing?",
      answer: "Yes! Annual billing gives you 2 months free (20% discount). Contact us to set up annual billing."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-grade encryption, regular security audits, and host in Australia. Your data is safe and stays in Australia."
    },
    {
      question: "Do you integrate with accounting software?",
      answer: "We're working on integrations with Xero and MYOB. For now, you can export data easily for your accountant."
    }
  ]

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, honest pricing
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            Three plans designed for trade businesses at every stage. 
            All plans include a 14-day free trial.
          </p>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 inline-block">
            <p className="text-orange-400">
              <strong>💰 Annual billing:</strong> Save 2 months (20% discount) on any plan
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`rounded-xl p-8 ${
                  plan.highlight 
                    ? 'border-2 border-orange-500 bg-gray-800 relative shadow-lg shadow-orange-500/20' 
                    : 'border border-gray-700 bg-gray-800'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    POPULAR
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-5xl font-bold text-white mb-2">
                    ${plan.price}
                    <span className="text-lg text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-300">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/auth/sign-up"
                  className={`w-full inline-block text-center px-6 py-3 font-semibold rounded-lg transition-colors ${
                    plan.highlight
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                      : 'border border-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {plan.cta}
                </Link>
                
                <p className="text-center text-sm text-gray-400 mt-3">
                  14-day free trial
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">
              Need a custom plan for larger teams?
            </p>
            <Link 
              href="/contact"
              className="text-orange-500 font-semibold hover:text-orange-400 transition-colors"
            >
              Contact us for enterprise pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Processing Transparency */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">
              💳 Online Payment Processing
            </h3>
            <p className="text-gray-300 mb-4">
              TradeQuote integrates with Stripe for secure payment processing. 
              Your customers can pay invoices online with credit cards or direct debit.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <strong className="text-gray-200">Stripe fees (charged by Stripe, not us):</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Credit cards: 1.75% + 30c per transaction</li>
                  <li>• Direct debit: 1.50% (capped at $5)</li>
                </ul>
              </div>
              <div>
                <strong className="text-gray-200">TradeQuote fees:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• $0 additional fees</li>
                  <li>• We don't take a cut</li>
                  <li>• Optional feature - use as needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently asked questions
            </h2>
          </div>
          
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-700 pb-8">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-300">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">
              Still have questions?
            </p>
            <Link 
              href="/contact"
              className="text-orange-500 font-semibold hover:text-orange-400 transition-colors"
            >
              Get in touch - we're here to help →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-200 mb-6">
            14-day free trial. No credit card required.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-block px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}