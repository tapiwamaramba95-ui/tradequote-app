-- =====================================================
-- FEEDBACK AND HELP CENTER SYSTEM
-- Date: 2026-03-31
-- Purpose: Add feedback collection and help center support
-- =====================================================

-- =====================================================
-- FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Feedback details
  type TEXT NOT NULL CHECK (type IN ('feature', 'bug', 'general')),
  sentiment TEXT CHECK (sentiment IN ('love', 'like', 'neutral', 'dislike')),
  title TEXT,
  description TEXT NOT NULL,
  
  -- Auto-captured context
  page_url TEXT,
  browser TEXT,
  os TEXT,
  screenshot_url TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'planned', 'done', 'declined')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Admin notes (internal only)
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

-- Users can create feedback
CREATE POLICY "Users can create feedback" ON feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- HELP ARTICLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Article details
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  
  -- Organization
  category TEXT NOT NULL CHECK (category IN ('getting-started', 'features', 'faq', 'billing', 'integrations')),
  subcategory TEXT,
  
  -- Display
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Author
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_help_articles_featured ON help_articles(featured);
CREATE INDEX IF NOT EXISTS idx_help_articles_display_order ON help_articles(display_order);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_help_articles_search ON help_articles
  USING gin(to_tsvector('english', title || ' ' || description || ' ' || content));

-- RLS - Help articles are public (everyone can read)
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published articles" ON help_articles
  FOR SELECT USING (is_published = true);

-- =====================================================
-- ARTICLE FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feedback
  was_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_feedback_article_id ON article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_article_feedback_user_id ON article_feedback(user_id);

-- RLS
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create article feedback" ON article_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own article feedback" ON article_feedback
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_updated_at ON feedback;
CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

DROP TRIGGER IF EXISTS help_articles_updated_at ON help_articles;
CREATE TRIGGER help_articles_updated_at
  BEFORE UPDATE ON help_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- =====================================================
-- SEED INITIAL HELP ARTICLES
-- =====================================================

-- Getting Started Articles
INSERT INTO help_articles (slug, title, description, content, category, featured, display_order, is_published, published_at)
VALUES 
(
  'create-your-first-job',
  'Create Your First Job',
  'Learn how to set up and manage a new job in TradeQuote',
  E'# Create Your First Job\n\nJobs are the foundation of your workflow in TradeQuote. Here''s how to create one:\n\n## Step 1: Navigate to Jobs\nClick **Jobs** in the sidebar navigation.\n\n## Step 2: Click New Job\nClick the **+ New Job** button in the top right.\n\n## Step 3: Fill in Job Details\n- **Job Name**: Give your job a descriptive name\n- **Client**: Select from existing clients or create a new one\n- **Address**: Enter the job site location\n- **Status**: Choose from Draft, Scheduled, In Progress, or Completed\n\n## Step 4: Add Additional Information (Optional)\n- Job description\n- Scheduled dates\n- Budget and quoted amount\n- Staff assignments\n\n## Step 5: Save\nClick **Create Job** to save.\n\n---\n\n**Next Steps:**\n- Create a quote for this job\n- Add timesheets for tracking labor\n- Upload job photos',
  'getting-started',
  true,
  1,
  true,
  NOW()
),
(
  'send-your-first-quote',
  'Send Your First Quote',
  'Create professional quotes and send them to clients',
  E'# Send Your First Quote\n\nQuotes help you provide accurate pricing to clients before starting work.\n\n## Step 1: Create a Quote\n1. Go to **Quotes** in the sidebar\n2. Click **+ New Quote**\n3. Select a client and job (optional)\n\n## Step 2: Add Line Items\n- Click **Add Item** or **Add from Price List**\n- Enter description, quantity, and rate\n- TradeQuote calculates totals automatically\n\n## Step 3: Add Terms and Notes\n- Payment terms (e.g., "50% deposit required")\n- Additional notes for the client\n- Valid until date\n\n## Step 4: Preview and Send\n1. Click **Preview** to see what the client will see\n2. Click **Send Quote**\n3. Enter client''s email address\n4. Quote is sent as a PDF attachment\n\n## Client Actions\nClients receive a link to:\n- View the quote online\n- Accept or decline\n- Add notes or questions\n\n---\n\n**Pro Tip:** Save commonly used items to your Price List for faster quote creation!',
  'getting-started',
  true,
  2,
  true,
  NOW()
),
(
  'create-your-first-invoice',
  'Create Your First Invoice',
  'Generate and send professional invoices to get paid faster',
  E'# Create Your First Invoice\n\nInvoices are how you request payment from clients.\n\n## Step 1: Create an Invoice\n1. Go to **Invoices** in the sidebar\n2. Click **+ New Invoice**\n3. Select a client\n4. Optionally link to a job or convert from a quote\n\n## Step 2: Add Line Items\n- Add services, materials, or labor charges\n- Use your price list for quick entry\n- TradeQuote calculates GST automatically\n\n## Step 3: Set Payment Terms\n- Due date\n- Payment methods accepted\n- Late payment terms\n\n## Step 4: Send to Client\n1. Click **Send Invoice**\n2. Client receives email with:\n   - PDF invoice attachment\n   - Link to view and pay online\n   - Payment button (if online payments enabled)\n\n## Tracking Payments\n- Mark invoices as paid manually\n- Online payments are tracked automatically\n- View payment history on each invoice\n\n---\n\n**Getting Paid Online:**\nEnable Stripe integration in Settings to accept credit card and bank transfers!',
  'getting-started',
  true,
  3,
  true,
  NOW()
);

-- Features Articles
INSERT INTO help_articles (slug, title, description, content, category, featured, display_order, is_published, published_at)
VALUES
(
  'managing-jobs-and-projects',
  'Managing Jobs and Projects',
  'Track job progress, costs, and profitability',
  E'# Managing Jobs and Projects\n\n## Job Overview\nEach job in TradeQuote contains:\n- Client information\n- Job site address\n- Status tracking\n- Quoted amount vs actual costs\n- Associated quotes and invoices\n- Timesheets and labor costs\n- Material costs\n- Photos and notes\n\n## Job Statuses\n- **Draft**: Planning stage\n- **Quoted**: Quote sent, awaiting acceptance\n- **Scheduled**: Work scheduled to begin\n- **In Progress**: Work underway\n- **Completed**: Job finished\n- **Cancelled**: Job cancelled\n\n## Tracking Costs\nView real-time profitability:\n- Labor costs from timesheets\n- Material costs from purchases\n- Subcontractor costs\n- Total costs vs quoted amount\n- Profit margin\n\n## Job Timeline\nSee full job history:\n- When created\n- Quotes sent and accepted\n- Work scheduled\n- Timesheets logged\n- Invoices sent\n- Payments received\n\n---\n\n**Pro Tip:** Use the profit dashboard to identify which job types are most profitable!',
  'features',
  true,
  1,
  true,
  NOW()
),
(
  'using-price-lists',
  'Using Price Lists',
  'Speed up quoting with saved price lists',
  E'# Using Price Lists\n\n## Why Use Price Lists?\n- Faster quote creation\n- Consistent pricing\n- Easy price updates\n- Automatic margin calculation\n\n## Creating Your Price List\n1. Go to **Settings → Price Lists**\n2. Click **Add Item**\n3. Enter:\n   - Item name\n   - Cost (what you pay)\n   - Unit (each, meter, hour)\n   - Category (for organization)\n4. Set default markup percentage\n\n## Using Price Lists in Quotes\n1. When creating a quote, click **Add from Price List**\n2. Search or browse your items\n3. Select items to add\n4. Adjust quantities\n5. Price is calculated: cost + markup = customer price\n\n## Supplier Price Lists\nImport supplier price lists:\n1. Export price list from supplier (CSV format)\n2. Go to **Settings → Price Lists → Supplier Price Lists**\n3. Click **Import Price List**\n4. Upload CSV file\n5. Map columns to TradeQuote fields\n\n---\n\n**CSV Format:**\n```\nSupplier Name, Product Code, Product Name, Unit, Price, Category\nBunnings, SKU123, Paint 10L White, each, 89.00, Paint\n```',
  'features',
  true,
  2,
  true,
  NOW()
),
(
  'setting-up-online-payments',
  'Setting Up Online Payments',
  'Get paid faster with online credit card and bank transfers',
  E'# Setting Up Online Payments\n\nAccept payments directly through your invoices with Stripe integration.\n\n## Why Online Payments?\n- Get paid 3x faster\n- Clients can pay 24/7\n- Automatic payment tracking\n- Reduced admin work\n- Professional image\n\n## Setup Process\n1. Go to **Settings → Payments**\n2. Click **Connect Stripe Account**\n3. Follow Stripe onboarding:\n   - Business details\n   - Bank account (for deposits)\n   - Identity verification\n4. Once approved, payments are enabled!\n\n## How It Works\nWhen you send an invoice:\n1. Client receives email with invoice\n2. They click **Pay Now** button\n3. Secure payment form opens (Stripe hosted)\n4. They enter card or bank details\n5. Payment processed instantly\n6. You receive notification\n7. Funds deposited to your bank (2-3 days)\n\n## Payment Methods Supported\n- Credit/Debit cards (Visa, Mastercard, Amex)\n- Bank transfers (direct debit)\n- Apple Pay / Google Pay\n\n## Fees\nStripe charges:\n- 1.75% + 30c per card transaction\n- 1% (max $5) for bank transfers\n\n---\n\n**Security:**\nStripe is bank-level secure. TradeQuote never stores card details.',
  'features',
  true,
  3,
  true,
  NOW()
);

-- FAQ Articles
INSERT INTO help_articles (slug, title, description, content, category, featured, display_order, is_published, published_at)
VALUES
(
  'how-do-i-change-my-plan',
  'How Do I Change My Plan?',
  'Upgrade, downgrade, or cancel your subscription',
  E'# How Do I Change My Plan?\n\n## Upgrading Your Plan\n1. Go to **Settings → Billing**\n2. Click **Change Plan**\n3. Select your new plan\n4. Confirm upgrade\n5. You''ll be charged a pro-rated amount for the current billing period\n\n## Downgrading Your Plan\n1. Go to **Settings → Billing**\n2. Click **Change Plan**\n3. Select lower tier plan\n4. Confirm downgrade\n5. Change takes effect at the end of your current billing period\n6. You''ll receive a credit for the unused portion\n\n## Cancelling Your Subscription\n1. Go to **Settings → Billing**\n2. Click **Cancel Subscription**\n3. Confirm cancellation\n4. You''ll retain access until the end of your paid period\n5. Your account moves to the Free plan\n\n## Free Plan Limitations\nAfter cancellation:\n- 10 jobs per month\n- 10 quotes per month\n- 10 invoices per month\n- 1 user only\n- Data retained for 90 days\n\n---\n\n**Need Help?** Contact support at support@tradequote.com.au',
  'faq',
  true,
  1,
  true,
  NOW()
),
(
  'can-i-export-my-data',
  'Can I Export My Data?',
  'How to backup and export your TradeQuote data',
  E'# Can I Export My Data?\n\nYes! You can export all your data at any time.\n\n## What Can Be Exported?\n- Jobs\n- Quotes\n- Invoices\n- Clients\n- Timesheets\n- Expenses\n- Reports\n\n## Export Process\n1. Go to **Settings → Data Export**\n2. Select what to export\n3. Choose date range\n4. Choose format (CSV, PDF, or Excel)\n5. Click **Export**\n6. Download file to your computer\n\n## Export Formats\n\n**CSV (Recommended)**\n- Open in Excel, Google Sheets, etc.\n- Easy to import into other software\n- All data fields included\n\n**PDF**\n- Formatted for printing\n- Good for record keeping\n- Cannot be edited\n\n**Excel**\n- Formatted spreadsheets\n- Formulas and formatting included\n- Graphs and charts\n\n## Scheduled Exports\nOn Pro and Enterprise plans:\n- Automatic weekly exports\n- Sent to your email\n- Stored in Dropbox or Google Drive\n\n---\n\n**Data Retention:**\nYour data is kept for 7 years for compliance.',
  'faq',
  true,
  2,
  true,
  NOW()
),
(
  'is-there-a-mobile-app',
  'Is There a Mobile App?',
  'Access TradeQuote on your phone or tablet',
  E'# Is There a Mobile App?\n\nTradeQuote works on any device through your web browser.\n\n## Mobile Web App\nNo app download needed:\n1. Open Safari (iPhone) or Chrome (Android)\n2. Go to app.tradequote.com.au\n3. Log in\n4. **Add to Home Screen** for quick access\n\n## Mobile Features\nFull functionality on mobile:\n- View and create jobs\n- Send quotes and invoices\n- Track time with mobile timesheets\n- Upload job photos\n- View reports and dashboards\n- Accept payments\n\n## Optimized for Mobile\n- Responsive design\n- Touch-friendly buttons\n- Fast loading\n- Offline support (coming soon)\n\n## Add to Home Screen\n\n**iPhone/iPad:**\n1. Open Safari\n2. Tap the Share button (square with arrow)\n3. Scroll down and tap **Add to Home Screen**\n4. Tap **Add**\n5. TradeQuote icon appears on your home screen\n\n**Android:**\n1. Open Chrome\n2. Tap the three dots menu\n3. Tap **Add to Home screen**\n4. Tap **Add**\n\n---\n\n**Native App Coming:**\nWe''re building iOS and Android apps. Join the waitlist in Settings!',
  'faq',
  true,
  3,
  true,
  NOW()
);

-- Verification query (commented out)
-- SELECT COUNT(*) as total_articles FROM help_articles WHERE is_published = true;
