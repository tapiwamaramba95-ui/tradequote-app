'use client'

import { useState } from 'react'
import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock, MessageSquare, HelpCircle, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: 'general',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Best for detailed questions and technical issues",
      contact: "hello@tradequote.au",
      timing: "Usually respond within 2 hours",
      primary: true
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "For urgent issues or quick questions",
      contact: "1300 TRADEQUOTE",
      timing: "Mon-Fri, 8am-6pm AEST",
      primary: false
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Available in the app for existing customers",
      contact: "Sign into your account",
      timing: "Mon-Fri, 9am-5pm AEST",
      primary: false
    }
  ]

  const subjects = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing Question' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'demo', label: 'Request Demo' },
    { value: 'partnership', label: 'Partnership Inquiry' }
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen">
        <Header />
        
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gray-800 rounded-xl p-12 border border-gray-700">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-6">
                <CheckCircle className="w-8 h-8 text-orange-500" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Thanks for reaching out!
              </h1>
              
              <p className="text-lg text-gray-300 mb-8">
                We've received your message and will get back to you within 2 hours during business hours.
              </p>
              
              <div className="space-y-4">
                <Link
                  href="/marketing"
                  className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 mr-4"
                >
                  Back to Home
                </Link>
                
                <p className="text-sm text-gray-400">
                  If you have an urgent issue, call us on 1300 TRADEQUOTE
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-200">
            Questions about TradeQuote? Need help with your account? 
            Want to suggest a feature? We're here to help.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-900">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Contact Form */}
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              Send us a message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="John Smith"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="john@smithelectrical.com.au"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0412 345 678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Smith Electrical Services"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What can we help with? *
                </label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {subjects.map((subject) => (
                    <option key={subject.value} value={subject.value}>
                      {subject.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Tell us how we can help..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-orange-500/30"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              
              <p className="text-sm text-gray-400 text-center">
                We typically respond within 2 hours during business hours
              </p>
            </form>
          </div>

          {/* Contact Methods & Info */}
          <div className="space-y-8">
            
            {/* Contact Methods */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Other ways to reach us
              </h2>
              
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div 
                    key={index}
                    className={`p-6 rounded-lg border ${
                      method.primary ? 'border-orange-500 bg-gray-800 shadow-lg shadow-orange-500/20' : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-2 rounded-lg mr-4 ${
                        method.primary ? 'bg-orange-500/10' : 'bg-gray-700'
                      }`}>
                        <method.icon className={`w-5 h-5 ${
                          method.primary ? 'text-orange-500' : 'text-gray-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{method.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{method.description}</p>
                        <p className="font-medium text-gray-200">{method.contact}</p>
                        <p className="text-sm text-gray-400">{method.timing}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="font-semibold text-white">Support Hours</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monday - Friday</span>
                  <span className="font-medium text-gray-200">8:00 AM - 6:00 PM AEST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Saturday</span>
                  <span className="font-medium text-gray-200">9:00 AM - 1:00 PM AEST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sunday</span>
                  <span className="font-medium text-gray-200">Closed</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center mb-4">
                <HelpCircle className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="font-semibold text-white">Need Quick Help?</h3>
              </div>
              <div className="space-y-3">
                <Link 
                  href="/features"
                  className="block text-orange-500 hover:text-orange-400 transition-colors"
                >
                  → View all features
                </Link>
                <Link 
                  href="/pricing"
                  className="block text-orange-500 hover:text-orange-400 transition-colors"
                >
                  → See pricing plans
                </Link>
                <Link 
                  href="/auth/sign-up"
                  className="block text-orange-500 hover:text-orange-400 transition-colors"
                >
                  → Start free trial
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}