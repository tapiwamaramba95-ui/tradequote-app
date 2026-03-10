# Claude Upload Folder Index

This directory contains copies of key pages from the TradeQuote application for Claude's context and analysis.

## 📁 Current Files

### Customer-Facing Pages (Public)

**Purpose**: These are public pages that customers interact with directly, without authentication.

1. **`customer-invoice-view-page.tsx`**
   - Original: `app/invoice/view/[token]/page.tsx`
   - Route: `/invoice/view/[token]`
   - Function: Customer invoice viewing with payment options

2. **`customer-quote-view-page.tsx`**
   - Original: `app/quote/view/[token]/page.tsx`  
   - Route: `/quote/view/[token]`
   - Function: Customer quote viewing with accept/decline actions

3. **`customer-enquiry-form-page.tsx`**
   - Original: `app/enquiry/[publicProfileName]/page.tsx`
   - Route: `/enquiry/[publicProfileName]`
   - Function: Public enquiry form for lead generation

4. **`customer-pages-documentation.md`**
   - Comprehensive documentation of all customer-facing pages
   - Technical implementation details
   - Design patterns and business impact

## 🎯 Page Types Summary

### Customer Interface Pages
- **Token-secured access** for invoices and quotes
- **Public access** for enquiry forms
- **Responsive design** optimized for mobile and desktop
- **Company branding** integration with dynamic theming
- **Professional styling** using centralized design system

## 🔧 Technical Stack

- **Next.js**: App router with dynamic routes
- **Supabase**: Public client for unauthenticated access
- **Tailwind CSS**: Responsive styling framework
- **TypeScript**: Type-safe component development
- **Color System**: Centralized design tokens

## 📋 Usage Notes

These files are provided for:
- **Context sharing** with Claude AI for development assistance
- **Code analysis** and review
- **Implementation reference** for similar features
- **Documentation** of customer experience patterns

## 🔄 Maintenance

When updating these copies:
1. Copy complete file contents from original locations
2. Use descriptive filenames that indicate their purpose
3. Update this index file to reflect changes
4. Include relevant documentation for new patterns or features

## 📈 Business Context

The customer-facing pages are critical for:
- **Professional brand presentation** to customers
- **Revenue generation** through quote acceptance and invoice payment
- **Lead capture** via public enquiry forms
- **Customer satisfaction** with intuitive, responsive interfaces

---

*Last Updated: March 9, 2026*
*Total Files: 4 (3 React components + 1 documentation)*