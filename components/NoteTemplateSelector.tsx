'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface NoteTemplate {
  id: string
  name: string
  content: string
  category: string
}

interface NoteTemplateSelectorProps {
  onSelect: (content: string) => void
  buttonClassName?: string
}

export default function NoteTemplateSelector({ onSelect, buttonClassName }: NoteTemplateSelectorProps) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (showDropdown && templates.length === 0) {
      fetchTemplates()
    }
  }, [showDropdown])

  const fetchTemplates = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('note_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (!error && data) {
      setTemplates(data)
    }
    setLoading(false)
  }

  const handleSelect = (template: NoteTemplate) => {
    onSelect(template.content)
    setShowDropdown(false)
  }

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, NoteTemplate[]>)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className={buttonClassName || "text-sm text-cyan-600 hover:text-cyan-700"}
      >
        📝 Load Template
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          {/* Dropdown */}
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No templates found. Create templates in{' '}
                <a href="/dashboard/settings/note-templates" className="text-cyan-600 hover:underline">
                  Settings
                </a>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      {category}
                    </div>
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelect(template)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {template.content.substring(0, 60)}...
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
