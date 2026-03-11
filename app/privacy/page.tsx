import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - TradeQuote',
  description: 'Privacy Policy for TradeQuote job management software. How we protect your data and respect your privacy in Australia.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Header */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-700">
            Last Updated: March 12, 2026
          </p>
          <p className="text-gray-600 mt-4">
            TradeQuote Pty Ltd ABN [YOUR ABN] ("TradeQuote," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use the TradeQuote service ("Service").
          </p>
          <p className="text-gray-600 mt-2">
            By using TradeQuote, you consent to the practices described in this Privacy Policy.
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            <h2>1. INFORMATION WE COLLECT</h2>
            
            <h3>1.1 Information You Provide to Us</h3>
            <p>When you create an account and use TradeQuote, you provide us with:</p>
            
            <p><strong>Account Information:</strong></p>
            <ul>
              <li>Business name</li>
              <li>Your name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Business address</li>
              <li>ABN (if applicable)</li>
              <li>Payment information (processed by Stripe)</li>
            </ul>

            <p><strong>Business Data:</strong></p>
            <ul>
              <li>Customer information (names, contact details, addresses)</li>
              <li>Quote and invoice details</li>
              <li>Job information</li>
              <li>Timesheet records</li>
              <li>Photos and files you upload</li>
              <li>Notes and descriptions</li>
              <li>Schedule and calendar information</li>
            </ul>

            <h3>1.2 Information We Collect Automatically</h3>
            <p>When you use the Service, we automatically collect:</p>
            
            <p><strong>Usage Information:</strong></p>
            <ul>
              <li>Pages and features you access</li>
              <li>Actions you perform</li>
              <li>Time and date of your activity</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>IP address</li>
              <li>Device information</li>
            </ul>

            <p><strong>Cookies and Similar Technologies:</strong></p>
            <ul>
              <li>We use cookies to maintain your session and remember your preferences</li>
              <li>Essential cookies for login and account access</li>
              <li>Analytics cookies to understand how you use the Service (if you consent)</li>
            </ul>

            <h3>1.3 Information from Third Parties</h3>
            <p>We may receive information from:</p>
            <ul>
              <li><strong>Stripe:</strong> Payment processing and transaction information</li>
              <li><strong>Google:</strong> If you connect Google Calendar</li>
              <li><strong>Xero/MYOB:</strong> If you enable accounting integrations (when available)</li>
            </ul>

            <h2>2. HOW WE USE YOUR INFORMATION</h2>
            
            <h3>2.1 To Provide the Service</h3>
            <p>We use your information to:</p>
            <ul>
              <li>Create and maintain your account</li>
              <li>Provide access to TradeQuote features</li>
              <li>Process your quotes, invoices, and jobs</li>
              <li>Enable communication with your customers</li>
              <li>Sync with third-party services you enable</li>
              <li>Process payments (via Stripe)</li>
              <li>Provide customer support</li>
            </ul>

            <h3>2.2 To Improve the Service</h3>
            <p>We use information to:</p>
            <ul>
              <li>Analyze how the Service is used</li>
              <li>Identify and fix technical issues</li>
              <li>Develop new features</li>
              <li>Improve user experience</li>
              <li>Understand user behavior (using anonymized data)</li>
            </ul>

            <h3>2.3 To Communicate with You</h3>
            <p>We may use your information to:</p>
            <ul>
              <li>Send transactional emails (invoice notifications, password resets, etc.)</li>
              <li>Send service updates and important notices</li>
              <li>Respond to your support requests</li>
              <li>Send product updates and new feature announcements</li>
              <li>Send marketing communications (you can opt out)</li>
            </ul>

            <h3>2.4 For Business Operations</h3>
            <p>We use information for:</p>
            <ul>
              <li>Billing and account management</li>
              <li>Fraud prevention and security</li>
              <li>Legal compliance</li>
              <li>Enforcing our Terms of Service</li>
            </ul>

            <h2>3. INFORMATION SHARING & DISCLOSURE</h2>
            
            <h3>3.1 We Do Not Sell Your Information</h3>
            <p>We do not sell, rent, or trade your personal information to third parties.</p>

            <h3>3.2 Service Providers</h3>
            <p>We share information with trusted service providers who help us operate TradeQuote:</p>
            
            <p><strong>Hosting & Infrastructure:</strong></p>
            <ul>
              <li><strong>Vercel, Inc.</strong> (United States) - Application hosting</li>
              <li><strong>Supabase, Inc.</strong> (United States) - Database services</li>
              <li><strong>Cloudinary</strong> (United States) - Photo storage</li>
            </ul>

            <p><strong>Payment Processing:</strong></p>
            <ul>
              <li><strong>Stripe, Inc.</strong> (United States) - Payment processing</li>
            </ul>

            <p><strong>Email Services:</strong></p>
            <ul>
              <li><strong>Resend</strong> (United States) - Transactional emails</li>
            </ul>

            <p><strong>Analytics (if enabled):</strong></p>
            <ul>
              <li><strong>Vercel Analytics</strong> - Usage analytics</li>
            </ul>

            <p>These providers are contractually obligated to protect your information and may only use it to provide services to us.</p>

            <h3>3.3 Third-Party Integrations</h3>
            <p>If you enable third-party integrations (Google Calendar, Xero, MYOB), we share relevant data with those services as necessary for the integration to function. These third parties have their own privacy policies.</p>

            <h3>3.4 Legal Requirements</h3>
            <p>We may disclose your information if required by law, court order, or government request, or if necessary to:</p>
            <ul>
              <li>Comply with legal obligations</li>
              <li>Protect the rights, property, or safety of TradeQuote, our users, or the public</li>
              <li>Prevent fraud or security threats</li>
              <li>Enforce our Terms of Service</li>
            </ul>

            <h3>3.5 Business Transfers</h3>
            <p>If TradeQuote is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.</p>

            <h2>4. DATA STORAGE & SECURITY</h2>
            
            <h3>4.1 Where We Store Your Data</h3>
            <p>Your data is stored on servers located in the United States, operated by Vercel and Supabase. By using TradeQuote, you consent to international data transfer.</p>

            <h3>4.2 How We Protect Your Data</h3>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li><strong>Encryption in transit:</strong> All data transmitted to/from TradeQuote uses HTTPS/TLS encryption</li>
              <li><strong>Encryption at rest:</strong> Data stored in our database is encrypted</li>
              <li><strong>Access controls:</strong> Limited employee access to data</li>
              <li><strong>Authentication:</strong> Secure password requirements</li>
              <li><strong>Regular backups:</strong> Automated daily backups</li>
              <li><strong>Security monitoring:</strong> Continuous monitoring via Sentry</li>
            </ul>

            <h3>4.3 No Absolute Security</h3>
            <p>While we take security seriously, no system is completely secure. You use the Service at your own risk.</p>

            <h2>5. DATA RETENTION</h2>
            
            <h3>5.1 Active Accounts</h3>
            <p>We retain your data for as long as your account is active and as necessary to provide the Service.</p>

            <h3>5.2 After Account Closure</h3>
            <p>After you cancel your subscription:</p>
            <ul>
              <li>You have 30 days to export your data</li>
              <li>We permanently delete your data 30 days after subscription ends</li>
              <li>We may retain anonymized, aggregated data for analytics</li>
              <li>We may retain certain information as required by law</li>
            </ul>

            <h3>5.3 Backups</h3>
            <p>Deleted data may persist in backups for up to 90 days.</p>

            <h2>6. YOUR RIGHTS & CHOICES</h2>
            
            <h3>6.1 Access Your Data</h3>
            <p>You can access all your data through your TradeQuote account at any time.</p>

            <h3>6.2 Correct Your Data</h3>
            <p>You can update your account information and business data directly through the Service.</p>

            <h3>6.3 Export Your Data</h3>
            <p>You can export your data from your account settings before canceling your subscription.</p>

            <h3>6.4 Delete Your Data</h3>
            <p>You can delete your account and all associated data by:</p>
            <ul>
              <li>Canceling your subscription through account settings</li>
              <li>Contacting support@tradequote.au</li>
            </ul>
            <p>Your data will be permanently deleted 30 days after cancellation.</p>

            <h3>6.5 Marketing Communications</h3>
            <p>You can opt out of marketing emails by:</p>
            <ul>
              <li>Clicking "unsubscribe" in any marketing email</li>
              <li>Updating preferences in your account settings</li>
              <li>Contacting support@tradequote.au</li>
            </ul>
            <p>Note: You cannot opt out of transactional emails (invoice notifications, security alerts, etc.) as these are essential to the Service.</p>

            <h3>6.6 Cookie Preferences</h3>
            <p>You can control cookies through your browser settings. Note that disabling essential cookies may affect Service functionality.</p>

            <h2>7. AUSTRALIAN PRIVACY PRINCIPLES (APPs)</h2>
            <p>TradeQuote complies with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs).</p>

            <h3>7.1 Collection Principles</h3>
            <p>We only collect information that is necessary for our business functions and clearly inform you about collection practices.</p>

            <h3>7.2 Use and Disclosure</h3>
            <p>We only use and disclose your information for the purposes for which it was collected, as described in this Privacy Policy.</p>

            <h3>7.3 Data Quality</h3>
            <p>We take reasonable steps to ensure the information we collect is accurate, complete, and up-to-date.</p>

            <h3>7.4 Security</h3>
            <p>We protect your information from misuse, interference, loss, unauthorized access, modification, or disclosure.</p>

            <h3>7.5 Access and Correction</h3>
            <p>You have the right to access and correct your personal information held by us.</p>

            <h3>7.6 Cross-Border Disclosure</h3>
            <p>We disclose personal information to overseas recipients (United States) as described in this Privacy Policy.</p>

            <h2>8. INTERNATIONAL DATA TRANSFERS</h2>
            
            <h3>8.1 United States Storage</h3>
            <p>Your data is stored on servers in the United States. While Australian privacy law applies to our collection and handling of your information, the data resides overseas.</p>

            <h3>8.2 Adequacy</h3>
            <p>The United States does not have an adequacy decision from the Australian government. However, our service providers (Vercel, Supabase, Stripe) implement security measures that meet or exceed Australian standards.</p>

            <h3>8.3 Your Consent</h3>
            <p>By using TradeQuote, you consent to the transfer of your data to the United States.</p>

            <h2>9. CHILDREN'S PRIVACY</h2>
            <p>TradeQuote is not intended for use by individuals under 18 years of age. We do not knowingly collect information from children. If we become aware that we have collected information from a child, we will delete it immediately.</p>

            <h2>10. DO NOT TRACK</h2>
            <p>Our Service does not currently respond to "Do Not Track" signals from browsers.</p>

            <h2>11. CUSTOMER DATA</h2>
            
            <h3>11.1 Your Customers' Information</h3>
            <p>When you use TradeQuote, you collect and store information about your customers (names, addresses, phone numbers, email addresses).</p>

            <h3>11.2 Your Responsibility</h3>
            <p>You are solely responsible for:</p>
            <ul>
              <li>Obtaining consent from your customers to collect and store their information</li>
              <li>Complying with privacy laws regarding your customers' data</li>
              <li>Informing your customers about how their data is used</li>
              <li>Responding to your customers' privacy requests</li>
            </ul>

            <h3>11.3 Our Role</h3>
            <p>We act as a service provider. We only process your customers' data on your behalf and in accordance with your instructions.</p>

            <h2>12. CHANGES TO THIS PRIVACY POLICY</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by:</p>
            <ul>
              <li>Posting the updated policy on our website</li>
              <li>Sending an email to your registered email address</li>
              <li>Displaying a notice in the Service</li>
            </ul>
            <p>Continued use of the Service after changes take effect constitutes acceptance of the updated Privacy Policy.</p>

            <h2>13. COMPLAINTS & DISPUTES</h2>
            
            <h3>13.1 Contact Us First</h3>
            <p>If you have concerns about how we handle your information, please contact us first at support@tradequote.au. We will investigate and respond to your complaint.</p>

            <h3>13.2 Australian Privacy Commissioner</h3>
            <p>If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC):</p>
            <ul>
              <li><strong>Website:</strong> oaic.gov.au</li>
              <li><strong>Phone:</strong> 1300 363 992</li>
              <li><strong>Email:</strong> enquiries@oaic.gov.au</li>
            </ul>

            <h2>14. COOKIES POLICY</h2>
            
            <h3>14.1 What Are Cookies</h3>
            <p>Cookies are small text files stored on your device when you visit a website.</p>

            <h3>14.2 How We Use Cookies</h3>
            <p><strong>Essential Cookies (Required):</strong></p>
            <ul>
              <li>Session management (keeping you logged in)</li>
              <li>Authentication</li>
              <li>Security features</li>
            </ul>

            <p><strong>Analytics Cookies (Optional):</strong></p>
            <ul>
              <li>Understanding how you use the Service</li>
              <li>Improving user experience</li>
              <li>Identifying technical issues</li>
            </ul>
            <p><strong>You can disable analytics cookies in your account settings.</strong></p>

            <h3>14.3 Third-Party Cookies</h3>
            <p>Our service providers (Stripe, Vercel) may also set cookies. These are governed by their respective privacy policies.</p>

            <h3>14.4 Managing Cookies</h3>
            <p>You can control cookies through your browser settings. Note that disabling essential cookies will prevent you from using the Service.</p>

            <h2>15. CONTACT INFORMATION</h2>
            <p>If you have questions about this Privacy Policy or how we handle your information:</p>
            <p><strong>Company:</strong> TradeQuote Pty Ltd<br />
            <strong>ABN:</strong> [YOUR ABN]<br />
            <strong>Address:</strong> Melbourne, VIC, Australia<br />
            <strong>Email:</strong> support@tradequote.au<br />
            <strong>Website:</strong> tradequote.au</p>

            <h2>16. ACKNOWLEDGEMENT</h2>
            <p>By using TradeQuote, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described herein.</p>

          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-blue-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🛡️ Your Data is Secure
              </h3>
              <p className="text-gray-700">
                We use bank-grade encryption and store all data in secure data centres. Your business information stays private and protected.
              </p>
            </div>

            <div className="bg-orange-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🇦🇺 Australian Owned
              </h3>
              <p className="text-gray-700">
                As an Australian company, we comply with all local privacy laws and understand the importance of protecting your data.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 mt-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Questions about Privacy?
            </h3>
            <p className="text-gray-700 mb-6">
              We're transparent about our privacy practices and happy to answer any questions.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Contact Our Privacy Team
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}