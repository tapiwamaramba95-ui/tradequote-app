'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId } from '@/lib/business'

interface PriceListItem {
  id: string
  name: string
  description: string
  cost: number
  unit: string
  category: string
}

interface PriceListBrowserProps {
  show: boolean
  onClose: () => void
  onSelect: (item: PriceListItem, calculatedPrice: number) => void
  applyMarkup: boolean // true for invoices/quotes, false for purchase orders
}

export default function PriceListBrowser({ show, onClose, onSelect, applyMarkup }: PriceListBrowserProps) {
  const [items, setItems] = useState<PriceListItem[]>([])
  const [defaultMarkup, setDefaultMarkup] = useState<number>(30)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  useEffect(() => {
    if (show) {
      fetchItems()
      if (applyMarkup) {
        fetchMarkupSettings()
      }
    }
  }, [show])

  const fetchItems = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const businessId = await getBusinessId()
    if (!businessId) return

    const { data, error } = await supabase
      .from('price_list_items')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  const fetchMarkupSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const businessId = await getBusinessId()
    if (!businessId) return

    const { data } = await supabase
      .from('business_settings')
      .select('default_markup_percentage')
      .eq('business_id', businessId)
      .single()

    if (data?.default_markup_percentage) {
      setDefaultMarkup(data.default_markup_percentage)
    }
  }

  const calculatePrice = (cost: number) => {
    if (applyMarkup) {
      return cost * (1 + defaultMarkup / 100)
    }
    return cost
  }

  const handleSelect = (item: PriceListItem) => {
    const price = calculatePrice(item.cost)
    onSelect(item, price)
    onClose()
  }

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(items.map(item => item.category || 'Uncategorized')))]

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || (item.category || 'Uncategorized') === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Select from Price List
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {applyMarkup && (
            <div className="mt-3 text-sm text-gray-600">
              💡 Markup: {defaultMarkup}% applied to all prices
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedCategory !== 'All' 
                ? 'No items match your search' 
                : 'No items in price list. Add items in Settings → Price List'}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item) => {
                const price = calculatePrice(item.cost)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-cyan-500 hover:bg-cyan-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          {item.category && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {applyMarkup ? (
                            <>
                              <span className="text-gray-500">
                                Cost: ${item.cost.toFixed(2)}
                              </span>
                              <span className="font-semibold text-cyan-600">
                                Selling Price: ${price.toFixed(2)} / {item.unit}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-gray-900">
                              ${price.toFixed(2)} / {item.unit}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ml-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-600 text-center">
            Showing {filteredItems.length} of {items.length} items
          </div>
        </div>
      </div>
    </div>
  )
}
