import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - TradeQuote',
  description: 'Terms of Service for TradeQuote job management software. Australian trade business software terms and conditions.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Header */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-700">
            Last Updated: March 12, 2026
          </p>
          <p className="text-gray-600 mt-4">
            Welcome to TradeQuote, a job management platform for Australian trade businesses. These Terms of Service ("Terms") govern your use of the TradeQuote service ("Service") provided by TradeQuote Pty Ltd ABN [YOUR ABN] ("TradeQuote," "we," "us," or "our").
          </p>
          <p className="text-gray-600 mt-2">
            By registering for or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you must not use the Service.
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            <h2>1. DEFINITIONS</h2>
            <p><strong>"Account"</strong> means your TradeQuote account created when you register for the Service.</p>
            <p><strong>"Data"</strong> means all content, information, and files you upload, create, or store in the Service, including customer information, quotes, invoices, jobs, and other business data.</p>
            <p><strong>"Service"</strong> means the TradeQuote platform, including the website, web application, mobile applications, and all related services.</p>
            <p><strong>"Subscription"</strong> means your paid access to the Service under one of our pricing plans.</p>
            <p><strong>"User"</strong> or "You" means the individual or business entity that has registered for and uses the Service.</p>

            <h2>2. ACCEPTANCE OF TERMS</h2>
            <p>By creating a TradeQuote account, you confirm that:</p>
            <ul>
              <li>You have read and understood these Terms</li>
              <li>You agree to be bound by these Terms</li>
              <li>You have the authority to enter into these Terms on behalf of your business (if applicable)</li>
              <li>You are at least 18 years old</li>
              <li>You will use the Service for lawful business purposes only</li>
            </ul>
            <p>We may update these Terms from time to time. We will notify you of material changes by email or through the Service. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>

            <h2>3. ACCOUNT REGISTRATION</h2>
            <h3>3.1 Creating Your Account</h3>
            <p>To use the Service, you must:</p>
            <ul>
              <li>Provide accurate and complete information during registration</li>
              <li>Provide your business name, ABN (if applicable), email address, and other required details</li>
              <li>Choose a secure password</li>
              <li>Keep your login credentials confidential</li>
            </ul>

            <h3>3.2 Account Responsibility</h3>
            <p>You are responsible for:</p>
            <ul>
              <li>All activity that occurs under your account</li>
              <li>Maintaining the security of your account credentials</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
              <li>Managing user access and permissions within your account</li>
            </ul>

            <h3>3.3 One Account Per Business</h3>
            <p>Each business may maintain only one active account. Creating multiple accounts for the same business is prohibited.</p>

            <h2>4. SUBSCRIPTION & BILLING</h2>
            <h3>4.1 Pricing Plans</h3>
            <p>TradeQuote offers three subscription plans:</p>
            <ul>
              <li><strong>Starter:</strong> $39 AUD per month</li>
              <li><strong>Professional:</strong> $49 AUD per month</li>
              <li><strong>Business:</strong> $89 AUD per month</li>
            </ul>
            <p>Current pricing and plan features are available at tradequote.au/pricing.</p>

            <h3>4.2 Free Trial</h3>
            <p>New users receive a 14-day free trial. During the trial:</p>
            <ul>
              <li>No credit card is required to start</li>
              <li>You have full access to features based on your selected plan</li>
              <li>No charges occur during the trial period</li>
              <li>You can cancel at any time without charge</li>
            </ul>

            <h3>4.3 Billing</h3>
            <p>After your trial ends:</p>
            <ul>
              <li>You will be prompted to add payment information</li>
              <li>Billing occurs monthly on the anniversary of your subscription start date</li>
              <li>Invoices are sent by email</li>
              <li>Payment is processed automatically via your chosen payment method</li>
              <li>All prices are in Australian Dollars (AUD)</li>
            </ul>

            <h3>4.4 Payment Methods</h3>
            <p>We accept payment via credit card or debit card through our payment processor, Stripe, Inc.</p>

            <h3>4.5 Failed Payments</h3>
            <p>If payment fails:</p>
            <ul>
              <li>We will retry charging your payment method</li>
              <li>You will receive email notification of the failure</li>
              <li>Your account may be suspended if payment is not received within 14 days</li>
              <li>Your subscription may be canceled if payment failure continues</li>
            </ul>

            <h3>4.6 Refunds</h3>
            <p>We do not offer refunds. The 14-day free trial is your opportunity to evaluate the Service. All subscription fees are non-refundable.</p>

            <h3>4.7 Price Changes</h3>
            <p>We may change our pricing with 30 days' notice. Notice will be sent to your registered email address. Price changes apply to renewal periods following the notice period.</p>

            <h2>5. CANCELLATION</h2>
            <h3>5.1 How to Cancel</h3>
            <p>You may cancel your subscription at any time through your account settings or by contacting support@tradequote.au.</p>

            <h3>5.2 Effect of Cancellation</h3>
            <p>Upon cancellation:</p>
            <ul>
              <li>Your access continues until the end of your current billing period</li>
              <li>No further charges will be made</li>
              <li>You can export your data before your access ends</li>
              <li>Your account and data will be permanently deleted 30 days after your subscription ends</li>
            </ul>

            <h3>5.3 No Refunds Upon Cancellation</h3>
            <p>Cancellation does not entitle you to a refund for the current billing period.</p>

            <h2>6. PAYMENT PROCESSING FEES</h2>
            <h3>6.1 Online Payment Collection</h3>
            <p>When you enable online payment collection through Stripe:</p>
            <ul>
              <li>Your customers can pay invoices via credit card or direct debit (BECS)</li>
              <li>Stripe charges processing fees for each transaction</li>
              <li>These fees are passed directly to your customers and clearly disclosed on invoices</li>
            </ul>

            <h3>6.2 Fee Structure</h3>
            <p>Payment processing fees charged to your customers:</p>
            <ul>
              <li><strong>Credit/Debit Cards:</strong> 1.75% + $0.30 AUD per transaction</li>
              <li><strong>Direct Debit (BECS):</strong> 1% of transaction amount (capped at $5.00 AUD)</li>
            </ul>

            <h3>6.3 Fee Transparency</h3>
            <p>We make payment processing fees clear to your customers:</p>
            <ul>
              <li>Fees are shown separately on invoices before payment</li>
              <li>The total amount (including fees) is displayed clearly</li>
              <li>Customers choose their payment method knowing the fee structure</li>
            </ul>

            <h3>6.4 No Markup</h3>
            <p>We do not profit from payment processing fees. The amounts charged to your customers match exactly what Stripe charges. We pass fees through at cost.</p>

            <h2>7. DATA OWNERSHIP & LICENSE</h2>
            <h3>7.1 Your Data</h3>
            <p>You retain all ownership rights to your Data. This includes:</p>
            <ul>
              <li>Customer information</li>
              <li>Quotes and invoices</li>
              <li>Job records</li>
              <li>Photos and files</li>
              <li>All other content you create or upload</li>
            </ul>

            <h3>7.2 License to TradeQuote</h3>
            <p>You grant us a limited license to:</p>
            <ul>
              <li>Store, process, and display your Data to provide the Service</li>
              <li>Back up your Data for disaster recovery</li>
              <li>Use anonymized, aggregated data for service improvement</li>
            </ul>
            <p>This license terminates when you delete your Data or close your account.</p>

            <h3>7.3 Data Storage</h3>
            <p>Your Data is stored on servers in Australia and the United States, operated by:</p>
            <ul>
              <li>Vercel, Inc. (application hosting)</li>
              <li>Supabase, Inc. (database)</li>
              <li>Cloudinary (photo storage)</li>
            </ul>
            <p>By using the Service, you consent to international data transfer and storage.</p>

            <h2>8. ACCEPTABLE USE</h2>
            <h3>8.1 Permitted Use</h3>
            <p>You may use the Service only for lawful business purposes related to managing your trade business.</p>

            <h3>8.2 Prohibited Activities</h3>
            <p>You must not:</p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Interfere with the operation of the Service</li>
              <li>Resell or redistribute the Service without permission</li>
              <li>Use the Service to send spam or unsolicited communications</li>
              <li>Scrape, copy, or extract data from the Service using automated means</li>
            </ul>

            <h3>8.3 Suspension for Violations</h3>
            <p>We reserve the right to suspend or terminate your access to the Service if you violate these Terms.</p>

            <h2>9. INTELLECTUAL PROPERTY</h2>
            <h3>9.1 TradeQuote Ownership</h3>
            <p>TradeQuote owns all rights to:</p>
            <ul>
              <li>The Service software and platform</li>
              <li>TradeQuote branding, logos, and trademarks</li>
              <li>Website content and documentation</li>
              <li>All intellectual property in the Service</li>
            </ul>

            <h3>9.2 Limited License</h3>
            <p>We grant you a limited, non-exclusive, non-transferable license to access and use the Service in accordance with these Terms.</p>

            <h2>10. THIRD-PARTY SERVICES</h2>
            <h3>10.1 Integrations</h3>
            <p>The Service may integrate with third-party services, including:</p>
            <ul>
              <li>Stripe (payment processing)</li>
              <li>Google Calendar (calendar synchronization)</li>
              <li>Xero and MYOB (accounting integration - when available)</li>
            </ul>

            <h3>10.2 Third-Party Terms</h3>
            <p>Your use of third-party integrations is subject to their respective terms and privacy policies. We are not responsible for third-party services.</p>

            <h3>10.3 Data Sharing</h3>
            <p>When you enable third-party integrations, you authorize us to share relevant Data with those services as necessary for the integration to function.</p>

            <h2>11. PRIVACY & SECURITY</h2>
            <h3>11.1 Privacy Policy</h3>
            <p>Our Privacy Policy explains how we collect, use, and protect your information. By using the Service, you also agree to our Privacy Policy.</p>

            <h3>11.2 Security</h3>
            <p>We implement industry-standard security measures to protect your Data, including:</p>
            <ul>
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>

            <h3>11.3 No Guarantee</h3>
            <p>While we take security seriously, we cannot guarantee absolute security. You use the Service at your own risk.</p>

            <h2>12. SERVICE AVAILABILITY</h2>
            <h3>12.1 Uptime Goal</h3>
            <p>We aim to provide 99.9% uptime, but we do not guarantee uninterrupted access to the Service.</p>

            <h3>12.2 Maintenance</h3>
            <p>We may perform scheduled maintenance that temporarily interrupts service. We will provide advance notice when possible.</p>

            <h3>12.3 No Liability for Downtime</h3>
            <p>We are not liable for any loss, damage, or inconvenience caused by service interruptions.</p>

            <h2>13. BACKUPS</h2>
            <h3>13.1 Our Backups</h3>
            <p>We perform regular automated backups of all Data for disaster recovery purposes.</p>

            <h3>13.2 Your Responsibility</h3>
            <p>While we back up your Data, you are responsible for maintaining your own copies of important information. We recommend regularly exporting your data.</p>

            <h3>13.3 No Guarantee</h3>
            <p>We do not guarantee that backups will be available or recoverable in all circumstances.</p>

            <h2>14. DISCLAIMERS & WARRANTIES</h2>
            <p><strong>14.1 "As Is" Service</strong><br />
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</p>

            <p><strong>14.2 No Warranties</strong><br />
            WE DISCLAIM ALL WARRANTIES, INCLUDING:</p>
            <ul>
              <li>MERCHANTABILITY</li>
              <li>FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>NON-INFRINGEMENT</li>
              <li>ACCURACY OR RELIABILITY</li>
              <li>ERROR-FREE OPERATION</li>
            </ul>

            <h2>15. LIMITATION OF LIABILITY</h2>
            <p><strong>15.1 Maximum Liability</strong><br />
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</p>

            <p><strong>15.2 Excluded Damages</strong><br />
            WE ARE NOT LIABLE FOR:</p>
            <ul>
              <li>INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>LOST PROFITS OR REVENUE</li>
              <li>LOST DATA</li>
              <li>BUSINESS INTERRUPTION</li>
              <li>LOSS OF OPPORTUNITY</li>
            </ul>

            <h2>16. INDEMNIFICATION</h2>
            <p>You agree to indemnify, defend, and hold harmless TradeQuote and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from:</p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any law or regulation</li>
              <li>Your violation of third-party rights</li>
              <li>Content you submit through the Service</li>
            </ul>

            <h2>17. TERMINATION</h2>
            <h3>17.1 Termination by You</h3>
            <p>You may terminate these Terms at any time by canceling your subscription.</p>

            <h3>17.2 Termination by Us</h3>
            <p>We may suspend or terminate your access to the Service if:</p>
            <ul>
              <li>You breach these Terms</li>
              <li>Payment is more than 30 days overdue</li>
              <li>We are required to do so by law</li>
              <li>We decide to discontinue the Service (with 30 days' notice)</li>
            </ul>

            <h3>17.3 Effect of Termination</h3>
            <p>Upon termination:</p>
            <ul>
              <li>Your access to the Service ends</li>
              <li>You remain responsible for all charges incurred</li>
              <li>You may export your Data before termination takes effect</li>
              <li>Your Data will be deleted 30 days after termination</li>
            </ul>

            <h2>18. AUSTRALIAN LAW & JURISDICTION</h2>
            <h3>18.1 Governing Law</h3>
            <p>These Terms are governed by the laws of Victoria, Australia.</p>

            <h3>18.2 Jurisdiction</h3>
            <p>You agree to submit to the exclusive jurisdiction of the courts of Victoria, Australia for any disputes arising from these Terms.</p>

            <h2>19. CONTACT INFORMATION</h2>
            <p><strong>Company:</strong> TradeQuote Pty Ltd<br />
            <strong>ABN:</strong> [YOUR ABN]<br />
            <strong>Address:</strong> Melbourne, VIC, Australia<br />
            <strong>Email:</strong> support@tradequote.au<br />
            <strong>Website:</strong> tradequote.au</p>

            <h2>20. ACKNOWLEDGEMENT</h2>
            <p>By using TradeQuote, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>

          </div>

          <div className="bg-gray-50 rounded-xl p-8 mt-12">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Questions about our Terms?
            </h3>
            <p className="text-gray-700 mb-6">
              We're happy to clarify any aspect of our Terms of Service. Our team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}