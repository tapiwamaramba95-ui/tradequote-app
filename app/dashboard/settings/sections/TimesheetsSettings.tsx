'use client'

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { SettingsCard } from '@/components/SettingsCard'
import Link from 'next/link'

export default function TimesheetsSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [defaultView, setDefaultView] = useState('week')
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [standardStartTime, setStandardStartTime] = useState('07:00')
  const [standardEndTime, setStandardEndTime] = useState('17:00')
  const [autoDeductBreaks, setAutoDeductBreaks] = useState(false)
  const [defaultBreakMinutes, setDefaultBreakMinutes] = useState(30)
  const [overtimeTriggerHours, setOvertimeTriggerHours] = useState(8)
  const [overtimeRate, setOvertimeRate] = useState(1.5)
  const [requireApproval, setRequireApproval] = useState(true)
  const [allowManualEntry, setAllowManualEntry] = useState(true)
  const [requireManualEntryReason, setRequireManualEntryReason] = useState(false)
  const [roundingInterval, setRoundingInterval] = useState(1)
  const [roundingMethod, setRoundingMethod] = useState('nearest')
  const [remindClockIn, setRemindClockIn] = useState(false)
  const [remindClockOut, setRemindClockOut] = useState(false)
  const [reminderTime, setReminderTime] = useState('18:00')
  const [exportFormat, setExportFormat] = useState('csv')
  const [includeNotesInExport, setIncludeNotesInExport] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('timesheet_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setDefaultView(data.default_view)
        setWeekStartDay(data.week_start_day)
        setStandardStartTime(data.standard_start_time)
        setStandardEndTime(data.standard_end_time)
        setAutoDeductBreaks(data.auto_deduct_breaks)
        setDefaultBreakMinutes(data.default_break_minutes)
        setOvertimeTriggerHours(data.overtime_trigger_hours)
        setOvertimeRate(data.overtime_rate)
        setRequireApproval(data.require_manager_approval)
        setAllowManualEntry(data.allow_manual_entry)
        setRequireManualEntryReason(data.require_manual_entry_reason)
        setRoundingInterval(data.rounding_interval)
        setRoundingMethod(data.rounding_method)
        setRemindClockIn(data.remind_clock_in)
        setRemindClockOut(data.remind_clock_out)
        setReminderTime(data.reminder_time)
        setExportFormat(data.export_format)
        setIncludeNotesInExport(data.include_notes_in_export)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('timesheet_settings')
        .update({
          default_view: defaultView,
          week_start_day: weekStartDay,
          standard_start_time: standardStartTime,
          standard_end_time: standardEndTime,
          auto_deduct_breaks: autoDeductBreaks,
          default_break_minutes: defaultBreakMinutes,
          overtime_trigger_hours: overtimeTriggerHours,
          overtime_rate: overtimeRate,
          require_manager_approval: requireApproval,
          allow_manual_entry: allowManualEntry,
          require_manual_entry_reason: requireManualEntryReason,
          rounding_interval: roundingInterval,
          rounding_method: roundingMethod,
          remind_clock_in: remindClockIn,
          remind_clock_out: remindClockOut,
          reminder_time: reminderTime,
          export_format: exportFormat,
          include_notes_in_export: includeNotesInExport,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (!error) {
        alert('Settings saved successfully!')
      } else {
        throw error
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent.DEFAULT }}></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
          Timesheet Settings
        </h1>
        <p className="text-gray-600">Configure how timesheets work for your business</p>
      </div>

      <div className="space-y-6">
        <SettingsCard title="General Preferences" description="View settings and default work hours">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Default View
              </label>
              <select
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value)}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              >
                <option value="day">Day View</option>
                <option value="week">Week View</option>
                <option value="month">Month View</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Week Start Day
              </label>
              <select
                value={weekStartDay}
                onChange={(e) => setWeekStartDay(Number(e.target.value))}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Standard Start Time
              </label>
              <input
                type="time"
                value={standardStartTime}
                onChange={(e) => setStandardStartTime(e.target.value)}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Standard End Time
              </label>
              <input
                type="time"
                value={standardEndTime}
                onChange={(e) => setStandardEndTime(e.target.value)}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              />
            </div>
          </div>

          <div className="mt-4 p-3 rounded-md" style={{
            backgroundColor: colors.background.hover,
            border: `1px solid ${colors.border.DEFAULT}`
          }}>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              💡 Timezone is configured in <Link href="/dashboard/settings?tab=company" className="underline" style={{ color: colors.accent.DEFAULT }}>Company Settings</Link>
            </p>
          </div>
        </SettingsCard>

        <SettingsCard title="Breaks & Time Tracking" description="Configure how breaks are handled">
          <div className="space-y-6">
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium" style={{ color: colors.text.primary }}>
                  Auto-deduct breaks
                </p>
                <p className="text-sm text-gray-500">
                  Automatically subtract break time from total hours
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDeductBreaks}
                  onChange={(e) => setAutoDeductBreaks(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {autoDeductBreaks && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Default Break Length (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="480"
                  value={defaultBreakMinutes}
                  onChange={(e) => setDefaultBreakMinutes(Number(e.target.value))}
                  className="w-full md:w-48 rounded-lg border-2 px-4 py-3 text-sm"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    backgroundColor: colors.background.card,
                    color: colors.text.primary,
                  }}
                />
              </div>
            )}
          </div>
        </SettingsCard>

        <SettingsCard title="Overtime Settings" description="Configure overtime calculations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Overtime After (hours per day)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={overtimeTriggerHours}
                onChange={(e) => setOvertimeTriggerHours(Number(e.target.value))}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Overtime Rate (e.g., 1.5x, 2.0x)
              </label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={overtimeRate}
                onChange={(e) => setOvertimeRate(Number(e.target.value))}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm"
                style={{
                  borderColor: colors.border.DEFAULT,
                  backgroundColor: colors.background.card,
                  color: colors.text.primary,
                }}
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Approval & Control" description="Manage timesheet approval workflow">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium" style={{ color: colors.text.primary }}>
                  Require manager approval
                </p>
                <p className="text-sm text-gray-500">
                  All timesheet entries must be approved before payroll
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium" style={{ color: colors.text.primary }}>
                  Allow manual time entry
                </p>
                <p className="text-sm text-gray-500">
                  Staff can add hours manually without using clock in/out
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowManualEntry}
                  onChange={(e) => setAllowManualEntry(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {allowManualEntry && (
              <div className="flex items-center justify-between py-4 pl-8">
                <div>
                  <p className="font-medium" style={{ color: colors.text.primary }}>
                    Require reason for manual entries
                  </p>
                  <p className="text-sm text-gray-500">
                    Staff must provide a reason when adding manual entries
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireManualEntryReason}
                    onChange={(e) => setRequireManualEntryReason(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            )}
          </div>
        </SettingsCard>

        <div className="flex justify-end pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: colors.accent.DEFAULT }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
