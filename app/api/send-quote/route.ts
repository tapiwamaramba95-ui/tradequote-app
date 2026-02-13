import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { to, quoteNumber, pdfUrl } = await request.json()

  try {
    const data = await resend.emails.send({
      from: 'TradeQuote <onboarding@resend.dev>', // Change this when you have a domain
      to: [to],
      subject: `Quote ${quoteNumber} from TradeQuote`,
      html: `
        <h2>Your Quote is Ready</h2>
        <p>Please find your quote attached.</p>
        <p>Quote Number: <strong>${quoteNumber}</strong></p>
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>TradeQuote Team</p>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}