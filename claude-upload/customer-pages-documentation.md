# Customer-Facing Pages Documentation

This folder contains copies of all customer-facing pages from the TradeQuote application. These are public pages that customers interact with directly, without authentication.

## Customer Pages Overview

### 1. **Customer Invoice View** (`customer-invoice-view-page.tsx`)
- **Original Path**: `app/invoice/view/[token]/page.tsx`
- **Route**: `/invoice/view/[token]`
- **Purpose**: Allows customers to view invoices sent to them via secure token links
- **Key Features**:
  - Responsive design with mobile-first approach
  - Company branding (logo, colors, name) integration
  - Invoice details display (number, dates, line items, totals)
  - Payment status tracking (paid/unpaid)
  - Bank transfer details section for unpaid invoices
  - Future Stripe payment integration placeholder
  - Professional invoice layout with notes and terms sections

### 2. **Customer Quote View** (`customer-quote-view-page.tsx`) 
- **Original Path**: `app/quote/view/[token]/page.tsx`
- **Route**: `/quote/view/[token]`
- **Purpose**: Allows customers to view and respond to quotes via secure token links
- **Key Features**:
  - Fully responsive quote display
  - Company branding integration
  - Quote details with line items and totals
  - Interactive accept/decline buttons
  - Status handling (pending, accepted, rejected)
  - Terms and notes display
  - Professional quote layout
  - Confirmation states for accepted/declined quotes

### 3. **Customer Enquiry Form** (`customer-enquiry-form-page.tsx`)
- **Original Path**: `app/enquiry/[publicProfileName]/page.tsx`  
- **Route**: `/enquiry/[publicProfileName]`
- **Purpose**: Public enquiry form for potential customers to request quotes
- **Key Features**:
  - Dynamic form fields based on business settings
  - Company logo and branding display
  - Client creation or matching logic
  - Job creation with 'enquiry' status
  - Form validation and submission handling
  - Success confirmation page
  - Configurable form fields (name, email, phone, address, description, preferred date)

## Technical Implementation

### Authentication & Security
- **Public Access**: All pages use public Supabase client for unauthenticated access
- **Token-Based Security**: Invoice and quote pages use secure token-based access
- **API Integration**: Use internal API endpoints (`/api/invoice/[token]`, `/api/quote/[token]`) for data fetching

### Responsive Design
- **Mobile-First**: All pages designed with mobile-first responsive approach
- **Breakpoints**: Uses Tailwind CSS responsive classes (sm:, md:, lg:)
- **Table Handling**: Special overflow handling for line items tables
- **Button Layout**: Responsive button arrangements (stacked on mobile, side-by-side on desktop)

### Branding Integration
- **Dynamic Colors**: Business-specific brand colors from database settings
- **Company Logos**: Logo display with fallback to company name
- **Professional Styling**: Enterprise-grade design using colors library
- **Consistent Theming**: Unified color scheme across all customer touchpoints

### Data Flow
1. **Invoice View**: Token → API → Business Settings + Invoice + Job + Client data
2. **Quote View**: Token → API → Business Settings + Quote + Job + Client data  
3. **Enquiry Form**: Public Profile → Settings Lookup → Client Creation/Match → Job Creation

### State Management
- Loading states with branded spinners
- Error handling with user-friendly messages
- Form submission states with disabled buttons
- Success/confirmation states

## Design Patterns

### Layout Structure
```
Header (Company Branding)
↓
Document Details (Number, Dates)
↓  
Customer Information (Bill To)
↓
Line Items Table (Responsive)
↓
Totals Section
↓
Notes/Terms (Collapsible)
↓
Action Buttons (Accept/Decline, Pay)
↓
Footer (Powered by TradeQuote)
```

### Color System Integration
- Uses centralized colors library from `@/lib/colors`
- Dynamic brand color injection from business settings
- Semantic color usage (success, error, warning, info)
- Professional color palette with proper contrast

### Performance Considerations
- Lazy loading of company logos
- Efficient data fetching with single API calls
- Minimal JavaScript bundle for customer-facing pages
- Optimized image handling with responsive sizes

## Business Impact

These customer-facing pages are critical for:
- **Professional Brand Image**: First impression for customers
- **Customer Experience**: Easy quote acceptance and invoice viewing
- **Lead Generation**: Public enquiry forms drive new business
- **Payment Collection**: Streamlined invoice payment process
- **Trust Building**: Professional, secure document presentation

## Dependencies

- **Next.js**: App router with dynamic routes
- **Supabase**: Database integration and public client
- **Tailwind CSS**: Responsive styling framework  
- **Colors Library**: Centralized design system
- **Lucide React**: Professional icon system (in updated versions)

## Future Enhancements

- Stripe payment integration for invoices
- PDF download functionality
- Email notification integration
- Multi-language support
- Enhanced mobile optimization
- Progressive Web App features