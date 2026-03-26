'use client'

'use client'

import { colors } from '@/lib/colors'

export default function SchedulerSettings() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.text.primary }}>
        Scheduler Settings
      </h1>
      <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
        Configure your scheduling and calendar preferences.
      </p>
      <div className="rounded-lg border p-8 text-center" style={{
        backgroundColor: colors.background.card,
        borderColor: colors.border.DEFAULT
      }}>
        <p style={{ color: colors.text.secondary }}>Coming Soon</p>
      </div>
    </div>
  )
}
