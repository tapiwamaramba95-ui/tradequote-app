/**
 * Recurring Job Form Component
 * Form for creating/editing recurring jobs with flexible scheduling and auto-invoicing
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Repeat, DollarSign, AlertCircle } from 'lucide-react'
import type { RecurringJobFormData, RecurringFrequency, RecurringEndType, InvoiceTiming } from '@/lib/recurring-jobs/types'

type RecurringJobFormProps = {
  initialData?: Partial<RecurringJobFormData>
  clients?: Array<{ id: string; name: string }>
  staff?: Array<{ id: string; name: string }>
  connections?: Array<{ id: string; name: string }>
  onSubmit: (data: RecurringJobFormData, isRecurring: boolean) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function RecurringJobForm({ 
  initialData, 
  clients = [],
  staff = [],
  connections = [],
  onSubmit, 
  onCancel,
  submitLabel = 'Create Job'
}: RecurringJobFormProps) {
  const [jobType, setJobType] = useState<'one-time' | 'recurring'>(
    initialData?.frequency ? 'recurring' : 'one-time'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<RecurringJobFormData>({
    title: '',
    client_id: '',
    frequency: 'weekly',
    interval_count: 1,
    days_of_week: [],
    start_date: new Date().toISOString().split('T')[0],
    end_type: 'never',
    end_after_occurrences: 12,
    generate_ahead_weeks: 2,
    auto_invoice: false,
    invoice_timing: 'on_completion',
    invoice_batch_day: 1,
    status: 'active',
    line_items: [],
    ...initialData
  })
  
  const updateField = <K extends keyof RecurringJobFormData>(
    field: K, 
    value: RecurringJobFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const toggleDayOfWeek = (day: number) => {
    const currentDays = formData.days_of_week || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort()
    updateField('days_of_week', newDays)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData, jobType === 'recurring')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Job Type Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Job Type</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
              jobType === 'one-time' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setJobType('one-time')}
          >
            <Calendar className="w-6 h-6 mb-2 text-orange-600" />
            <div className="font-medium">One-time Job</div>
            <div className="text-xs text-gray-500 mt-1">Single job</div>
          </button>
          
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
              jobType === 'recurring' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setJobType('recurring')}
          >
            <Repeat className="w-6 h-6 mb-2 text-orange-600" />
            <div className="font-medium">Recurring Job</div>
            <div className="text-xs text-gray-500 mt-1">Auto-generates instances</div>
          </button>
        </div>
      </Card>
      
      {/* Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Job Details</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g., Lawn Mowing, Pool Cleaning"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Additional details about this job"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
            />
          </div>
          
          <div>
            <Label htmlFor="client_id">Client *</Label>
            <select
              id="client_id"
              value={formData.client_id}
              onChange={(e) => updateField('client_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          
          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="street_address">Street Address</Label>
              <Input
                id="street_address"
                value={formData.street_address || ''}
                onChange={(e) => updateField('street_address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            
            <div>
              <Label htmlFor="suburb">Suburb</Label>
              <Input
                id="suburb"
                value={formData.suburb || ''}
                onChange={(e) => updateField('suburb', e.target.value)}
                placeholder="Sydney"
              />
            </div>
            
            <div>
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                value={formData.state || ''}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select state</option>
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="QLD">QLD</option>
                <option value="WA">WA</option>
                <option value="SA">SA</option>
                <option value="TAS">TAS</option>
                <option value="ACT">ACT</option>
                <option value="NT">NT</option>
              </select>
            </div>
          </div>
          
          {/* Staff/Connection Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staff_member_id">Assign to Staff</Label>
              <select
                id="staff_member_id"
                value={formData.staff_member_id || ''}
                onChange={(e) => updateField('staff_member_id', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">None</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="assigned_connection_id">Assign to Connection</Label>
              <select
                id="assigned_connection_id"
                value={formData.assigned_connection_id || ''}
                onChange={(e) => updateField('assigned_connection_id', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">None</option>
                {connections.map(connection => (
                  <option key={connection.id} value={connection.id}>{connection.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Recurring Schedule - Only show if recurring */}
      {jobType === 'recurring' && (
        <Card className="p-6 border-2 border-orange-200 bg-orange-50/30">
          <div className="flex items-center gap-2 mb-4">
            <Repeat className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Recurring Schedule</h3>
          </div>
          
          <div className="space-y-4">
            {/* Frequency */}
            <div>
              <Label htmlFor="frequency">Frequency *</Label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => updateField('frequency', e.target.value as RecurringFrequency)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            
            {/* Days of Week - Show for weekly/fortnightly */}
            {(formData.frequency === 'weekly' || formData.frequency === 'fortnightly') && (
              <div>
                <Label>Repeat on *</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      className={`px-3 py-2 rounded-md border transition-colors ${
                        (formData.days_of_week || []).includes(index + 1)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleDayOfWeek(index + 1)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {(formData.days_of_week || []).length === 0 && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please select at least one day
                  </p>
                )}
              </div>
            )}
            
            {/* Day of Month - Show for monthly */}
            {formData.frequency === 'monthly' && (
              <div>
                <Label htmlFor="day_of_month">Day of Month *</Label>
                <Input
                  id="day_of_month"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.day_of_month || ''}
                  onChange={(e) => updateField('day_of_month', parseInt(e.target.value))}
                  placeholder="e.g., 15 for 15th of each month"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter -1 for last day of month
                </p>
              </div>
            )}
            
            {/* Start Date */}
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                required
              />
            </div>
            
            {/* End Condition */}
            <div>
              <Label>End Date</Label>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.end_type === 'never'}
                    onChange={() => updateField('end_type', 'never')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span>Never</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.end_type === 'after_occurrences'}
                    onChange={() => updateField('end_type', 'after_occurrences')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span>After</span>
                  <Input
                    type="number"
                    min="1"
                    className="w-20"
                    value={formData.end_after_occurrences || ''}
                    onChange={(e) => updateField('end_after_occurrences', parseInt(e.target.value))}
                    disabled={formData.end_type !== 'after_occurrences'}
                  />
                  <span>occurrences</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.end_type === 'on_date'}
                    onChange={() => updateField('end_type', 'on_date')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span>On</span>
                  <Input
                    type="date"
                    className="w-40"
                    value={formData.end_date || ''}
                    onChange={(e) => updateField('end_date', e.target.value)}
                    disabled={formData.end_type !== 'on_date'}
                  />
                </label>
              </div>
            </div>
            
            {/* Generate Ahead */}
            <div>
              <Label htmlFor="generate_ahead_weeks">Auto-generate jobs</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="generate_ahead_weeks"
                  type="number"
                  min="1"
                  max="52"
                  className="w-20"
                  value={formData.generate_ahead_weeks}
                  onChange={(e) => updateField('generate_ahead_weeks', parseInt(e.target.value))}
                />
                <span className="text-sm text-gray-600">weeks in advance</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Jobs will be created automatically this many weeks ahead
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Auto-Invoicing - Only show if recurring */}
      {jobType === 'recurring' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Auto-Invoicing</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Auto-Invoicing</Label>
                <p className="text-sm text-gray-500">
                  Automatically create invoices for completed jobs
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateField('auto_invoice', !formData.auto_invoice)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.auto_invoice ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.auto_invoice ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {formData.auto_invoice && (
              <>
                <div>
                  <Label htmlFor="invoice_timing">Invoice Timing</Label>
                  <select
                    id="invoice_timing"
                    value={formData.invoice_timing}
                    onChange={(e) => updateField('invoice_timing', e.target.value as InvoiceTiming)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="on_completion">
                      On completion (invoice per job)
                    </option>
                    <option value="on_schedule">
                      On schedule (regardless of completion)
                    </option>
                    <option value="batch_monthly">
                      Monthly batch (one invoice per month)
                    </option>
                    <option value="batch_quarterly">
                      Quarterly batch (one invoice per quarter)
                    </option>
                  </select>
                </div>
                
                {(formData.invoice_timing === 'batch_monthly' || 
                  formData.invoice_timing === 'batch_quarterly') && (
                  <div>
                    <Label htmlFor="invoice_batch_day">Invoice on day of month</Label>
                    <Input
                      id="invoice_batch_day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.invoice_batch_day || 1}
                      onChange={(e) => updateField('invoice_batch_day', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Day of the month to generate batch invoice (1-31)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}
      
      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
