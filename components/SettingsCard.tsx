import { colors } from '@/lib/colors'
import { ReactNode, memo } from 'react'

type SettingsCardProps = {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}

export const SettingsCard = memo(function SettingsCard({ title, description, children, action }: SettingsCardProps) {
  return (
    <div
      className="rounded-lg border p-6 mb-6"
      style={{
        backgroundColor: colors.background.card,
        borderColor: colors.border.DEFAULT,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
            {title}
          </h3>
          {description && (
            <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
})

export default SettingsCard;
