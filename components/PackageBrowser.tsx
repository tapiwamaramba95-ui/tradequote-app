'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId } from '@/lib/business'
import { X, Package, ChevronDown, ChevronUp } from 'lucide-react'

interface MaterialPackage {
  id: string
  name: string
  category: string | null
  description: string | null
}

interface PackageItem {
  id: string
  item_name: string
  item_description: string | null
  quantity: number
  unit: string
  unit_cost: number
  line_total: number
}

interface PackageWithItems extends MaterialPackage {
  items: PackageItem[]
  total_cost: number
}

interface PackageBrowserProps {
  show: boolean
  onClose: () => void
  onSelect: (pkg: PackageWithItems, customerDescription: string, customerPrice: number) => void
}

export default function PackageBrowser({ show, onClose, onSelect }: PackageBrowserProps) {
  const [packages, setPackages] = useState<PackageWithItems[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null)
  
  // Selected package for pricing
  const [selectedPackage, setSelectedPackage] = useState<PackageWithItems | null>(null)
  const [customerDescription, setCustomerDescription] = useState('')
  const [customerPrice, setCustomerPrice] = useState('')
  const [defaultMarkup, setDefaultMarkup] = useState<number>(100) // 100% markup default

  useEffect(() => {
    if (show) {
      fetchPackages()
      fetchMarkupSettings()
    }
  }, [show])

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const businessId = await getBusinessId()
      if (!businessId) return

      // Fetch all packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('material_packages')
        .select('*')
        .eq('business_id', businessId)
        .order('name', { ascending: true })

      if (packagesError || !packagesData) {
        setLoading(false)
        return
      }

      // Fetch items for each package
      const packagesWithItems: PackageWithItems[] = []
      for (const pkg of packagesData) {
        const { data: items } = await supabase
          .from('material_package_items')
          .select('*')
          .eq('package_id', pkg.id)

        const totalCost = items?.reduce((sum, item) => sum + item.line_total, 0) || 0
        
        packagesWithItems.push({
          ...pkg,
          items: items || [],
          total_cost: totalCost
        })
      }

      setPackages(packagesWithItems)
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
    setLoading(false)
  }

  const fetchMarkupSettings = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching markup:', error)
    }
  }

  const handleSelectPackage = (pkg: PackageWithItems) => {
    setSelectedPackage(pkg)
    setCustomerDescription(pkg.name)
    // Calculate suggested price with markup
    const suggestedPrice = pkg.total_cost * (1 + defaultMarkup / 100)
    setCustomerPrice(suggestedPrice.toFixed(2))
  }

  const handleConfirmSelection = () => {
    if (!selectedPackage || !customerDescription || !customerPrice) return
    onSelect(selectedPackage, customerDescription, parseFloat(customerPrice))
    onClose()
  }

  const toggleExpanded = (packageId: string) => {
    setExpandedPackageId(expandedPackageId === packageId ? null : packageId)
  }

  // Filter packages
  const categories = ['All', ...Array.from(new Set(packages.map(pkg => pkg.category || 'Uncategorized')))]
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || (pkg.category || 'Uncategorized') === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Package size={24} className="text-orange-600" />
              Select Material Package
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search packages..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              💡 Default markup: <strong>{defaultMarkup}%</strong>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading packages...</div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedCategory !== 'All' 
                ? 'No packages match your search' 
                : 'No packages created yet. Create packages in Settings → Price Lists → Material Packages'}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border-2 rounded-lg transition-all ${
                    selectedPackage?.id === pkg.id 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                          {pkg.category && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {pkg.category}
                            </span>
                          )}
                        </div>
                        {pkg.description && (
                          <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-600">
                            <strong>{pkg.items.length}</strong> items
                          </span>
                          <span className="font-semibold text-gray-900">
                            Cost: ${pkg.total_cost.toFixed(2)}
                          </span>
                          <span className="text-green-600 font-semibold">
                            Suggested Price: ${(pkg.total_cost * (1 + defaultMarkup / 100)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded(pkg.id)
                          }}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          {expandedPackageId === pkg.id ? (
                            <ChevronUp size={20} className="text-gray-600" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Item Details */}
                  {expandedPackageId === pkg.id && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Package Contents:</h4>
                        <div className="space-y-1.5">
                          {pkg.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm py-1.5 px-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <span className="font-medium text-gray-900">{item.item_name}</span>
                                {item.item_description && (
                                  <span className="text-gray-600 ml-2">- {item.item_description}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-gray-700">
                                <span>Qty: {item.quantity} {item.unit}</span>
                                <span className="font-medium">${item.line_total.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Package Configuration */}
        {selectedPackage && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Configure Package for Quote/Invoice</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Description *
                  </label>
                  <input
                    type="text"
                    value={customerDescription}
                    onChange={(e) => setCustomerDescription(e.target.value)}
                    placeholder="What the customer will see"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    E.g., "Cabinetry Supply & Installation" instead of showing "{selectedPackage.name}"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-600">$</span>
                    <input
                      type="number"
                      value={customerPrice}
                      onChange={(e) => setCustomerPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cost: ${selectedPackage.total_cost.toFixed(2)} | 
                    Profit: ${customerPrice ? (parseFloat(customerPrice) - selectedPackage.total_cost).toFixed(2) : '0.00'} |
                    Margin: {customerPrice ? ((parseFloat(customerPrice) - selectedPackage.total_cost) / parseFloat(customerPrice) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!customerDescription || !customerPrice}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
