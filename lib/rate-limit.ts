// Simple in-memory rate limiting
// For production, consider using Redis or Upstash for distributed rate limiting

const rateLimit = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetAt) {
      rateLimit.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function checkRateLimit(
  identifier: string, // IP address or email
  maxRequests: number = 5, // Max requests
  windowMs: number = 60000 // Time window (1 minute)
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = rateLimit.get(identifier)
  
  // No record or window expired
  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs
    rateLimit.set(identifier, {
      count: 1,
      resetAt,
    })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }
  
  // Within window
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }
  
  // Increment count
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt }
}

// Get time until rate limit resets (in seconds)
export function getResetTime(identifier: string): number | null {
  const record = rateLimit.get(identifier)
  if (!record) return null
  
  const now = Date.now()
  if (now > record.resetAt) return null
  
  return Math.ceil((record.resetAt - now) / 1000)
}

// Clear rate limit for an identifier (useful for testing)
export function clearRateLimit(identifier: string): void {
  rateLimit.delete(identifier)
}
