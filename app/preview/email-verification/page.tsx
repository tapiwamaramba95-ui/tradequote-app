'use client'

export default function EmailPreview() {
  const sampleConfirmationURL = "https://plklwsnpphfolpsudbso.supabase.co/auth/v1/verify?token=sample-token&type=signup"
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verification Preview</h1>
          <p className="text-gray-600">This is how the verification email will look when sent to users:</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white p-4">
            <h2 className="text-lg font-semibold">📧 Email Preview</h2>
            <p className="text-sm text-gray-300">From: TradeQuote &lt;noreply@tradequote.com.au&gt;</p>
            <p className="text-sm text-gray-300">Subject: Verify your TradeQuote account</p>
          </div>
          
          <div className="p-0">
            <iframe 
              srcDoc={getEmailHTML(sampleConfirmationURL)}
              className="w-full h-[800px] border-0"
              title="Email Preview"
            />
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Email Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Professional TradeQuote branding</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Orange theme consistency</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Clear call-to-action button</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Mobile responsive design</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Security information included</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Company contact details</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Fallback link for accessibility</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Professional typography</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getEmailHTML(confirmationURL: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - TradeQuote</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #ea580c, #f97316);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-size: 32px;
            color: white;
        }
        h1 {
            color: #1f2937;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 8px 0 0 0;
        }
        .content {
            margin: 30px 0;
        }
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #ea580c, #f97316);
            color: white !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.2s ease;
        }
        .verify-button:hover {
            background: linear-gradient(135deg, #dc2626, #ea580c);
            transform: translateY(-1px);
        }
        .security-note {
            background: #f3f4f6;
            border-left: 4px solid #ea580c;
            padding: 16px;
            border-radius: 4px;
            margin: 30px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #ea580c;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📋</div>
            <h1>Verify Your Email</h1>
            <p class="subtitle">Welcome to TradeQuote! Let's get your account set up.</p>
        </div>

        <div class="content">
            <p>Hi there,</p>
            
            <p>Thanks for creating your TradeQuote account! To complete your registration and start creating professional quotes and invoices, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationURL}" class="verify-button">
                    Verify Email Address
                </a>
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul style="color: #4b5563; line-height: 1.8;">
                <li>✅ Complete your business profile setup</li>
                <li>✅ Create and send professional quotes</li>
                <li>✅ Generate invoices and track payments</li>
                <li>✅ Manage jobs and schedule work</li>
            </ul>

            <div class="security-note">
                <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours. If you didn't create a TradeQuote account, you can safely ignore this email.
            </div>
        </div>

        <div class="footer">
            <p>
                This email was sent by <strong>TradeQuote</strong><br>
                The professional quoting and invoicing solution for Australian trades.
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #6b7280; word-break: break-all;">${confirmationURL}</span>
            </p>
        </div>
    </div>
</body>
</html>
  `
}