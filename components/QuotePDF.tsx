import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { colors } from '@/lib/colors'

type LineItem = {
  description: string
  quantity: number
  rate: number
  amount: number
}

type Quote = {
  id?: string
  quote_number: string
  created_at: string
  valid_until: string
  line_items: LineItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  terms?: string
  jobs: {
    title: string
    clients: {
      name: string
      email: string
      phone: string
      address: string
    }
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    backgroundColor: colors.background.main,
  },
  headerBar: {
    backgroundColor: colors.accent.DEFAULT,
    padding: 18,
    borderRadius: 6,
    color: colors.text.inverse,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  headerRight: {
    fontSize: 12,
    color: colors.text.inverse,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    color: colors.text.primary,
  },
  text: {
    marginBottom: 4,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background.main,
    padding: 8,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  totals: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalLabel: {
    width: 100,
    textAlign: 'right',
    marginRight: 20,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    color: colors.accent.DEFAULT,
  },
  businessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 80,
    height: 24,
  },
  card: {
    backgroundColor: colors.background.card,
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
})

export function QuotePDF({ quote }: { quote: Quote }) {
  const job = Array.isArray(quote.jobs) ? quote.jobs[0] : quote.jobs
  const client = job?.clients || {}

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerTitle}>TradeQuote</Text>
            <Text style={{ fontSize: 10, color: '#ffffff' }}>Professional Quotes Made Simple</Text>
          </View>
          <View>
            <Text style={styles.headerRight}>QUOTE</Text>
            <Text style={styles.headerRight}>#{quote.quote_number}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.businessRow}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text.primary }}>Bill To</Text>
              <Text style={styles.text}>{client.name || ''}</Text>
              {client.email && <Text style={styles.text}>{client.email}</Text>}
              {client.phone && <Text style={styles.text}>{client.phone}</Text>}
              {client.address && <Text style={styles.text}>{client.address}</Text>}
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text.primary }}>Details</Text>
              <Text style={styles.text}>Project: {job?.title || ''}</Text>
              <Text style={styles.text}>Date: {new Date(quote.created_at).toLocaleDateString()}</Text>
              <Text style={styles.text}>Valid Until: {new Date(quote.valid_until).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.text}>{quote.jobs.clients.name}</Text>
          <Text style={styles.text}>{quote.jobs.clients.email}</Text>
          <Text style={styles.text}>{quote.jobs.clients.phone}</Text>
          <Text style={styles.text}>{quote.jobs.clients.address}</Text>
        </View>

        {/* Job Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project</Text>
          <Text style={styles.text}>{quote.jobs.title}</Text>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Rate</Text>
            <Text style={styles.col4}>Amount</Text>
          </View>
          
          {quote.line_items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>${item.rate.toFixed(2)}</Text>
              <Text style={styles.col4}>${item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${quote.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>${quote.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${quote.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.text}>{quote.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {quote.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.text}>{quote.terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}