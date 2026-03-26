import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'
import Link from 'next/link'
import { Mail, Phone, MapPin, Shield, Heart, Zap, Users } from 'lucide-react'

export const metadata = {
  title: 'About TradeQuote - Australian Owned Trade Business Software',
  description: 'TradeQuote was built by Australian tradies for Australian tradies. Simple software for quotes, invoices, and job management.',
}

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "Australian Owned & Operated",
      description: "Founded by tradies in Australia. Your data stays in Australia, and we understand local business needs."
    },
    {
      icon: Heart,
      title: "Built for Tradies",
      description: "We know the trade industry because we've been there. Every feature is designed with real trade businesses in mind."
    },
    {
      icon: Zap,
      title: "Keep it Simple",
      description: "No complicated features you don't need. Just the essential tools to run your business efficiently."
    },
    {
      icon: Users,
      title: "Real Support",
      description: "When you need help, you talk to real people who understand your business. No outsourced call centers."
    }
  ]

  const stats = [
    { number: "500+", label: "Trade Businesses" },
    { number: "$2M+", label: "Quotes Sent" },
    { number: "4.8/5", label: "Customer Rating" },
    { number: "99.9%", label: "Uptime" }
  ]

  const team = [
    {
      name: "Mike Thompson",
      role: "Co-Founder & CEO",
      bio: "Former electrician turned software developer. Built TradeQuote after struggling with complicated business software in his electrical company.",
      background: "15 years in electrical trade"
    },
    {
      name: "Sarah Chen",
      role: "Co-Founder & CTO",
      bio: "Software engineer with 12 years experience building business applications. Passionate about simple, effective software design.",
      background: "Ex-Google engineer"
    },
    {
      name: "Dave Wilson",
      role: "Head of Product",
      bio: "Former plumbing contractor who joined TradeQuote to help shape features based on real trade business needs.",
      background: "10 years plumbing business"
    }
  ]

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Built by tradies, for tradies
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            TradeQuote was born from frustration with complicated business software 
            that just didn't work for trade businesses. We built something better.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Our Story
            </h2>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-300 mb-6">
              In 2019, Mike was running a successful electrical contracting business in Melbourne. 
              But he was drowning in paperwork, struggling with invoicing, and losing track of jobs. 
              Every business software he tried was either too complicated, too expensive, or built 
              for office workers - not tradies.
            </p>
            
            <p className="text-gray-300 mb-6">
              After yet another frustrating evening trying to send a simple quote, Mike decided 
              to build his own solution. He teamed up with software engineer Sarah Chen to create 
              TradeQuote - business software designed specifically for Australian trade businesses.
            </p>
            
            <p className="text-gray-300 mb-6">
              We started with a simple goal: create the business software we wished we'd had as tradies. 
              No unnecessary features, no complicated setup, just the essential tools to run a professional 
              trade business efficiently.
            </p>
            
            <p className="text-gray-300">
              Today, TradeQuote powers hundreds of trade businesses across Australia. We're still 
              Australian owned and operated, and we're still focused on keeping things simple 
              and effective for tradies.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              What We Stand For
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg mb-4">
                  <value.icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-gray-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Meet the Team
            </h2>
            <p className="text-xl text-gray-200">
              Real people who understand trade businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Users className="w-12 h-12 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <div className="text-orange-500 font-semibold mb-3">{member.role}</div>
                <p className="text-gray-300 mb-3">{member.bio}</p>
                <div className="text-sm text-gray-400 font-medium">{member.background}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Australian Focus */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">
              🇦🇺 Proudly Australian
            </h3>
            <p className="text-gray-300 mb-6">
              TradeQuote is 100% Australian owned and operated. Our servers are in Australia, 
              our team is in Australia, and we understand Australian business requirements.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div>
                <strong className="text-gray-200">Data Security:</strong><br />
                Your data stays in Australia and is protected by Australian privacy laws
              </div>
              <div>
                <strong className="text-gray-200">Local Support:</strong><br />
                Talk to real Australians who understand your business during business hours
              </div>
              <div>
                <strong className="text-gray-200">Built for Aussie Tradies:</strong><br />
                GST handling, ABN support, and features designed for Australian businesses
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-gray-300">
              We'd love to hear from you. Whether you have questions, feedback, 
              or just want to chat about your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg mb-4">
                <Mail className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Email Support</h3>
              <p className="text-gray-300 mb-1">hello@tradequote.au</p>
              <p className="text-sm text-gray-400">Usually respond within 2 hours</p>
            </div>
            
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg mb-4">
                <Phone className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Phone Support</h3>
              <p className="text-gray-300 mb-1">1300 TRADEQUOTE</p>
              <p className="text-sm text-gray-400">Mon-Fri, 8am-6pm AEST</p>
            </div>
            
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg mb-4">
                <MapPin className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Office</h3>
              <p className="text-gray-300 mb-1">Melbourne, VIC</p>
              <p className="text-sm text-gray-400">By appointment</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
            >
              Send us a message
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}