import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

type LineItem = {
  description: string
  quantity: number
  rate: number
  amount: number
}

type Quote = {
  quote_number: string
  created_at: string
  valid_until: string
  line_items: LineItem[]
  subtotal: number
  tax: number
  total: number
  notes: string
  terms: string
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
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quoteNumber: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottom: '1 solid #000',
    paddingBottom: 4,
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
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: 'bold',
    borderTop: '2 solid #000',
    paddingTop: 8,
    marginTop: 8,
  },
})

export function QuotePDF({ quote }: { quote: Quote }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>QUOTE</Text>
          <Text style={styles.quoteNumber}>Quote #{quote.quote_number}</Text>
          <Text style={styles.text}>Date: {new Date(quote.created_at).toLocaleDateString()}</Text>
          <Text style={styles.text}>Valid Until: {new Date(quote.valid_until).toLocaleDateString()}</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.text}>{quote.terms}</Text>
        </View>
      </Page>
    </Document>
  )
}