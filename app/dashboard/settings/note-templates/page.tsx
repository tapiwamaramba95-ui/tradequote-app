'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { StickyNote, Plus, Edit, Trash2 } from 'lucide-react'

interface NoteTemplate {
  id: string
  name: string
  content: string
  category: string
  created_at: string
}

export default function NoteTemplatesPage() {
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: ''
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingTemplate) {
      // Update existing template
      const { error } = await supabase
        .from('note_templates')
        .update({
          name: formData.name,
          content: formData.content,
          category: formData.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id)
        .eq('user_id', user.id)

      if (!error) {
        fetchTemplates()
        closeModal()
      }
    } else {
      // Create new template
      const { error } = await supabase
        .from('note_templates')
        .insert({
          user_id: user.id,
          name: formData.name,
          content: formData.content,
          category: formData.category
        })

      if (!error) {
        fetchTemplates()
        closeModal()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('note_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      fetchTemplates()
    }
  }

  const openModal = (template?: NoteTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        content: template.content,
        category: template.category || ''
      })
    } else {
      setEditingTemplate(null)
      setFormData({ name: '', content: '', category: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTemplate(null)
    setFormData({ name: '', content: '', category: '' })
  }

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, NoteTemplate[]>)

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <StickyNote size={24} style={{ color: colors.accent.DEFAULT }} />
            <h1 className="text-2xl font-semibold" style={{ color: colors.text.primary }}>
              Note Templates
            </h1>
          </div>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Create reusable note templates for invoices, quotes, and purchase orders
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: colors.accent.DEFAULT,
            color: colors.text.inverse
          }}
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      {loading ? (
        <div style={{ color: colors.text.secondary }}>Loading templates...</div>
      ) : templates.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT
          }}
        >
          <p style={{ color: colors.text.secondary }}>
            No note templates yet. Create your first template to speed up document creation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.primary }}>
                {category}
              </h3>
              <div className="grid gap-4">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-lg border p-4"
                    style={{
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.DEFAULT
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>
                          {template.name}
                        </h4>
                        <p
                          className="text-sm whitespace-pre-wrap"
                          style={{ color: colors.text.secondary }}
                        >
                          {template.content}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openModal(template)}
                          className="px-3 py-1 text-sm rounded"
                          style={{
                            backgroundColor: `${colors.accent.DEFAULT}20`,
                            color: colors.accent.DEFAULT
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="px-3 py-1 text-sm rounded"
                          style={{
                            backgroundColor: `${colors.semantic.error}20`,
                            color: colors.semantic.error
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg shadow-xl max-w-2xl w-full p-6"
            style={{ backgroundColor: colors.background.card }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                  placeholder="e.g., Standard Service Call"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                  placeholder="e.g., General, Plumbing, Electrical"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                  Template Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                  placeholder="Enter the note content that will be used in documents..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded border"
                  style={{
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-medium"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                    color: colors.text.inverse
                  }}
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
