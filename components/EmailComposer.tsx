import { useState } from 'react'
import { X, Mail, Send, Type, AtSign, User, FileText, DollarSign, Calendar } from 'lucide-react'
import { colors } from '@/lib/colors'

type EmailComposerProps = {
  isOpen: boolean
  onClose: () => void
  onSend: (emailData: { subject: string; body: string; sendCopy: boolean }) => Promise<void>
  type: 'invoice' | 'quote'
  documentNumber: string
  clientName?: string
  clientEmail?: string
  total?: number
  companyName?: string
}

const EMAIL_VARIABLES = [
  { id: 'client_name', label: 'Client Name', icon: User, value: '{client_name}' },
  { id: 'document_number', label: 'Document Number', icon: FileText, value: '{document_number}' },
  { id: 'total_amount', label: 'Total Amount', icon: DollarSign, value: '{total_amount}' },
  { id: 'company_name', label: 'Company Name', icon: AtSign, value: '{company_name}' },
  { id: 'today_date', label: 'Today\'s Date', icon: Calendar, value: '{today_date}' },
]

export function EmailComposer({ 
  isOpen, 
  onClose, 
  onSend, 
  type, 
  documentNumber, 
  clientName = '',
  clientEmail = '',
  total = 0,
  companyName = ''
}: EmailComposerProps) {
  const [subject, setSubject] = useState(`${type === 'invoice' ? 'Invoice' : 'Quote'} #${documentNumber}`)
  const [body, setBody] = useState(
    `Hi {client_name},\n\nPlease find attached your ${type} #${documentNumber}.\n\n${
      type === 'invoice' 
        ? 'The total amount is {total_amount}. Payment is due according to the terms stated in the invoice.'
        : 'We look forward to working with you on this project.'
    }\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\n{company_name}`
  )
  const [sendCopy, setSendCopy] = useState(false)
  const [sending, setSending] = useState(false)

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newBody = body.substring(0, start) + variable + body.substring(end)
      setBody(newBody)
      
      // Reset cursor position after variable insertion
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  const previewText = (text: string) => {
    return text
      .replace(/{client_name}/g, clientName || 'Client Name')
      .replace(/{document_number}/g, documentNumber)
      .replace(/{total_amount}/g, total > 0 ? `$${total.toFixed(2)}` : '$0.00')
      .replace(/{company_name}/g, companyName || 'Your Company')
      .replace(/{today_date}/g, new Date().toLocaleDateString())
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await onSend({ subject, body, sendCopy })
    } catch (error) {
      console.error('Error sending email:', error)
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={onClose}
        />

        {/* Modal */}
        <div 
          className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-lg"
          style={{ backgroundColor: colors.background.card }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: colors.border.DEFAULT }}
          >
            <div className="flex items-center">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-lg mr-3"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.DEFAULT}, ${colors.accent.DEFAULT}CC)`
                }}
              >
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                  Compose Email
                </h3>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Sending {type} #{documentNumber} to {clientEmail}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md transition-colors hover:bg-gray-100"
              style={{ color: colors.text.muted }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-96">
            {/* Variable Panel */}
            <div 
              className="w-1/3 border-r overflow-y-auto"
              style={{ borderColor: colors.border.DEFAULT }}
            >
              <div className="p-4">
                <h4 className="text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
                  Insert Variables
                </h4>
                <div className="space-y-2">
                  {EMAIL_VARIABLES.map((variable) => {
                    const IconComponent = variable.icon
                    return (
                      <button
                        key={variable.id}
                        onClick={() => insertVariable(variable.value)}
                        className="flex items-center w-full p-2 text-left rounded-md transition-colors hover:bg-gray-50"
                        style={{ color: colors.text.secondary }}
                      >
                        <IconComponent className="w-4 h-4 mr-2" style={{ color: colors.accent.DEFAULT }} />
                        <span className="text-sm">{variable.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Email Form */}
            <div className="flex-1 p-6 flex flex-col">
              {/* Subject */}
              <div className="mb-4">
                <label className="flex items-center text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  <Type className="w-4 h-4 mr-2" style={{ color: colors.accent.DEFAULT }} />
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.main,
                    color: colors.text.primary,
                    '--tw-ring-color': colors.accent.DEFAULT,
                  } as React.CSSProperties}
                  placeholder={`Enter ${type} subject...`}
                />
              </div>

              {/* Body */}
              <div className="flex-1 mb-4">
                <label className="flex items-center text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  <Mail className="w-4 h-4 mr-2" style={{ color: colors.accent.DEFAULT }} />
                  Message
                </label>
                <textarea
                  name="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.main,
                    color: colors.text.primary,
                    '--tw-ring-color': colors.accent.DEFAULT,
                  } as React.CSSProperties}
                  placeholder={`Enter your ${type} message...`}
                />
              </div>

              {/* Send Copy Option */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendCopy}
                    onChange={(e) => setSendCopy(e.target.checked)}
                    className="mr-2"
                    style={{ accentColor: colors.accent.DEFAULT }}
                  />
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    Send a copy to myself
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {(subject || body) && (
            <div 
              className="border-t px-6 py-4"
              style={{ borderColor: colors.border.DEFAULT, backgroundColor: colors.background.hover }}
            >
              <h4 className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                Preview
              </h4>
              <div 
                className="p-3 rounded-md border text-sm"
                style={{ 
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card 
                }}
              >
                <div className="mb-2">
                  <strong style={{ color: colors.text.primary }}>Subject:</strong>
                  <span className="ml-2" style={{ color: colors.text.secondary }}>
                    {previewText(subject)}
                  </span>
                </div>
                <div>
                  <strong style={{ color: colors.text.primary }}>Message:</strong>
                  <div 
                    className="mt-1 whitespace-pre-wrap"
                    style={{ color: colors.text.secondary }}
                  >
                    {previewText(body)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-t"
            style={{ borderColor: colors.border.DEFAULT }}
          >
            <div className="text-sm" style={{ color: colors.text.muted }}>
              Click on variables in the left panel to insert them into your message
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md border transition-colors"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              >
                {sending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {type === 'invoice' ? 'Invoice' : 'Quote'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}