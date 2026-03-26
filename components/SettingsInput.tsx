import { colors } from '@/lib/colors'
import { memo } from 'react'

type SettingsInputProps = {
  label: string
  type?: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  helpText?: string
}

export const SettingsInput = memo(function SettingsInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  helpText,
}: SettingsInputProps) {
  return (
    <div className="mb-4">
      <label className="block text-base font-medium mb-2" style={{ color: colors.text.primary }}>
        {label} {required && <span style={{ color: colors.semantic.error }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-md border px-4 py-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed h-11"
        style={{
          borderColor: colors.border.DEFAULT,
          backgroundColor: colors.background.card,
          color: colors.text.primary,
        }}
      />
      {helpText && (
        <p className="text-sm mt-1.5" style={{ color: colors.text.muted }}>
          {helpText}
        </p>
      )}
    </div>
  )
})

export default SettingsInput;
