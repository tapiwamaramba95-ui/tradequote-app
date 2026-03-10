// ============================================
// PHONE NUMBER FORMATTING
// ============================================

export function formatAustralianPhone(input: string): string {
  if (!input) return ''
  
  // Remove all non-digits
  const digits = input.replace(/\D/g, '')
  
  // Handle different formats
  if (digits.startsWith('61')) {
    // International format: +61 412 345 678
    const number = digits.slice(2)
    if (number.length >= 9) {
      return `+61 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 9)}`
    }
    return input
  } else if (digits.startsWith('04') && digits.length === 10) {
    // Mobile: 0412 345 678
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`
  } else if (digits.length === 10) {
    // Landline: (03) 1234 5678
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6, 10)}`
  } else if (digits.length === 8) {
    // Short landline: 1234 5678
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`
  }
  
  return input
}

export function isValidAustralianPhone(phone: string): boolean {
  if (!phone) return false
  
  const digits = phone.replace(/\D/g, '')
  
  // Mobile: starts with 04, 10 digits total
  if (digits.startsWith('04') && digits.length === 10) return true
  
  // Landline: 10 digits
  if (digits.length === 10) return true
  
  // Short landline: 8 digits
  if (digits.length === 8) return true
  
  // International: +61
  if (digits.startsWith('61') && digits.length === 11) return true
  
  return false
}

// ============================================
// EMAIL FORMATTING
// ============================================

export function normalizeEmail(input: string): string {
  if (!input) return ''
  
  return input
    .trim()                    // Remove spaces
    .toLowerCase()             // All lowercase
    .replace(/\.{2,}/g, '.')  // Remove double dots
}

export function isValidEmail(email: string): boolean {
  if (!email) return false
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function suggestEmailCorrection(email: string): string | null {
  if (!email) return null
  
  const commonTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'outlool.com': 'outlook.com',
    'bigpon.com': 'bigpond.com',
    'bigpnd.com': 'bigpond.com'
  }
  
  const parts = email.split('@')
  if (parts.length !== 2) return null
  
  const domain = parts[1]
  if (commonTypos[domain]) {
    return `${parts[0]}@${commonTypos[domain]}`
  }
  
  return null
}