'use server'

export async function verifyRecaptcha(token: string): Promise<{
  success: boolean
  score: number
  action: string
  errors?: string[]
}> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  
  if (!secretKey) {
    console.error('reCAPTCHA secret key not configured')
    return {
      success: false,
      score: 0,
      action: '',
      errors: ['reCAPTCHA not configured']
    }
  }
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })
    
    const data = await response.json()
    
    return {
      success: data.success,
      score: data.score || 0,
      action: data.action || '',
      errors: data['error-codes'],
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return {
      success: false,
      score: 0,
      action: '',
      errors: ['Verification failed']
    }
  }
}
