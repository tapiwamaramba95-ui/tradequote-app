# Email Verification Template Setup

## Problem
The default Supabase email verification emails look "dodgy" and unprofessional. They need proper branding and styling.

## Solution
Custom branded email templates with TradeQuote styling.

## Setup Instructions

### 1. Supabase Dashboard Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select your project
3. Go to **Authentication** → **Templates**
4. Click **Confirm signup**

### 2. Email Template Configuration

Replace the default template with this HTML:

```html
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📋</div>
            <h1>Verify Your Email</h1>
            <p class="subtitle">Welcome to TradeQuote! Let's get your account set up.</p>
        </div>

        <div>
            <p>Hi there,</p>
            
            <p>Thanks for creating your TradeQuote account! To complete your registration and start creating professional quotes and invoices, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" class="verify-button">
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
                {{ .ConfirmationURL }}
            </p>
        </div>
    </div>
</body>
</html>
```

### 3. Set Email Subject

Set the **Subject** to:
```
Verify your TradeQuote account
```

### 4. Test the Template

1. Save the template
2. Create a test account to see the new branded email
3. Check that it displays properly on desktop and mobile

## Features of New Template

✅ **Professional branding** with TradeQuote colors
✅ **Clear call-to-action** button
✅ **Mobile responsive** design  
✅ **Security information** included
✅ **Company information** and contact details
✅ **Professional typography** and layout
✅ **Fallback link** if button doesn't work

The new email will look professional and clearly identify it's from TradeQuote, eliminating the "dodgy" appearance.