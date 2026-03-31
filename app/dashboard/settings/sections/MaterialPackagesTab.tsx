'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import { getBusinessId } from '@/lib/business'
import { Package, Plus, Edit2, Trash2, Copy, X } from 'lucide-react'

interface MaterialPackage {
  id: string
  business_id: string
  name: string
  category: string | null
  description: string | null
  created_at: string
  updated_at: string
}

interface PackageItem {
  id: string
  package_id: string
  price_list_item_id: string
  item_name: string
  item_description: string | null
  supplier: string | null
  quantity: number
  unit: string
  unit_cost: number
  line_total: number
}

interface PriceListItem {
  id: string
  name: string
  description: string | null
  cost: number
  unit: string
  category: string | null
}

export default function MaterialPackagesTab() {
  // State
  const [packages, setPackages] = useState<MaterialPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<MaterialPackage | null>(null)
  
  // Package form data
  const [packageForm, setPackageForm] = useState({
    name: '',
    category: '',
    description: ''
  })
  
  // Package items state
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null)
  const [packageItems, setPackageItems] = useState<PackageItem[]>([])
  const [showItemSelector, setShowItemSelector] = useState(false)
  const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Load packages on mount
  useEffect(() => {
    fetchPackages()
  }, [])

  // Fetch all packages
  const fetchPackages = async () => {
    setLoading(true)
    try {
      const businessId = await getBusinessId()
      if (!businessId) return

      const { data, error } = await supabase
        .from('material_packages')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPackages(data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
    setLoading(false)
  }

  // Fetch package items
  const fetchPackageItems = async (packageId: string) => {
    try {
      const { data, error } = await supabase
        .from('material_package_items')
        .select('*')
        .eq('package_id', packageId)

      if (!error && data) {
        setPackageItems(data)
      }
    } catch (error) {
      console.error('Error fetching package items:', error)
    }
  }

  // Fetch price list items for selector
  const fetchPriceListItems = async () => {
    try {
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
        setPriceListItems(data)
      }
    } catch (error) {
      console.error('Error fetching price list items:', error)
    }
  }

  // Open package modal
  const openPackageModal = (pkg?: MaterialPackage) => {
    if (pkg) {
      setEditingPackage(pkg)
      setPackageForm({
        name: pkg.name,
        category: pkg.category || '',
        description: pkg.description || ''
      })
      setCurrentPackageId(pkg.id)
      fetchPackageItems(pkg.id)
    } else {
      setEditingPackage(null)
      setPackageForm({ name: '', category: '', description: '' })
      setCurrentPackageId(null)
      setPackageItems([])
    }
    setShowPackageModal(true)
  }

  // Close package modal
  const closePackageModal = () => {
    setShowPackageModal(false)
    setEditingPackage(null)
    setPackageForm({ name: '', category: '', description: '' })
    setCurrentPackageId(null)
    setPackageItems([])
  }

  // Save package
  const handleSavePackage = async () => {
    try {
      const businessId = await getBusinessId()
      if (!businessId) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (editingPackage) {
        // Update existing package
        const { error } = await supabase
          .from('material_packages')
          .update({
            name: packageForm.name,
            category: packageForm.category || null,
            description: packageForm.description || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPackage.id)
          .eq('business_id', businessId)

        if (!error) {
          fetchPackages()
          closePackageModal()
        }
      } else {
        // Create new package
        const { data, error } = await supabase
          .from('material_packages')
          .insert({
            business_id: businessId,
            name: packageForm.name,
            category: packageForm.category || null,
            description: packageForm.description || null,
            created_by: user.id
          })
          .select()
          .single()

        if (!error && data) {
          setCurrentPackageId(data.id)
          setEditingPackage(data)
          fetchPackages()
        }
      }
    } catch (error) {
      console.error('Error saving package:', error)
      alert('Failed to save package')
    }
  }

  // Delete package
  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package? This cannot be undone.')) return

    try {
      const businessId = await getBusinessId()
      if (!businessId) return

      const { error } = await supabase
        .from('material_packages')
        .delete()
        .eq('id', packageId)
        .eq('business_id', businessId)

      if (!error) {
        fetchPackages()
      }
    } catch (error) {
      console.error('Error deleting package:', error)
      alert('Failed to delete package')
    }
  }

  // Clone package
  const handleClonePackage = async (pkg: MaterialPackage) => {
    try {
      const businessId = await getBusinessId()
      if (!businessId) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create new package
      const { data: newPackage, error: packageError } = await supabase
        .from('material_packages')
        .insert({
          business_id: businessId,
          name: `${pkg.name} (Copy)`,
          category: pkg.category,
          description: pkg.description,
          created_by: user.id
        })
        .select()
        .single()

      if (packageError || !newPackage) {
        alert('Failed to clone package')
        return
      }

      // Fetch and clone items
      const { data: items } = await supabase
        .from('material_package_items')
        .select('*')
        .eq('package_id', pkg.id)

      if (items && items.length > 0) {
        const newItems = items.map(item => ({
          package_id: newPackage.id,
          price_list_item_id: item.price_list_item_id,
          item_name: item.item_name,
          item_description: item.item_description,
          supplier: item.supplier,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost,
          line_total: item.line_total
        }))

        await supabase
          .from('material_package_items')
          .insert(newItems)
      }

      fetchPackages()
      alert('Package cloned successfully!')
    } catch (error) {
      console.error('Error cloning package:', error)
      alert('Failed to clone package')
    }
  }

  // Add item to package
  const handleAddItem = async (priceListItem: PriceListItem) => {
    if (!currentPackageId) {
      alert('Please save the package first before adding items')
      return
    }

    try {
      const quantity = 1
      const lineTotal = priceListItem.cost * quantity

      const { error } = await supabase
        .from('material_package_items')
        .insert({
          package_id: currentPackageId,
          price_list_item_id: priceListItem.id,
          item_name: priceListItem.name,
          item_description: priceListItem.description,
          supplier: null, // You can extend this if you track suppliers in price_list_items
          quantity: quantity,
          unit: priceListItem.unit,
          unit_cost: priceListItem.cost,
          line_total: lineTotal
        })

      if (!error) {
        fetchPackageItems(currentPackageId)
        setShowItemSelector(false)
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item')
    }
  }

  // Update item quantity
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return

    const item = packageItems.find(i => i.id === itemId)
    if (!item) return

    const newLineTotal = item.unit_cost * newQuantity

    try {
      const { error } = await supabase
        .from('material_package_items')
        .update({
          quantity: newQuantity,
          line_total: newLineTotal
        })
        .eq('id', itemId)

      if (!error && currentPackageId) {
        fetchPackageItems(currentPackageId)
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  // Remove item from package
  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this item from the package?')) return

    try {
      const { error } = await supabase
        .from('material_package_items')
        .delete()
        .eq('id', itemId)

      if (!error && currentPackageId) {
        fetchPackageItems(currentPackageId)
      }
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  // Calculate package total
  const calculatePackageTotal = () => {
    return packageItems.reduce((sum, item) => sum + item.line_total, 0)
  }

  // Filter price list items
  const categories = ['All', ...Array.from(new Set(priceListItems.map(item => item.category || 'Uncategorized')))]
  const filteredPriceListItems = priceListItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || (item.category || 'Uncategorized') === selectedCategory
    // Don't show items already in package
    const notInPackage = !packageItems.some(pi => pi.price_list_item_id === item.id)
    return matchesSearch && matchesCategory && notInPackage
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Create reusable packages of materials to speed up quote creation
          </p>
        </div>
        <button
          onClick={() => openPackageModal()}
          className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          style={{
            backgroundColor: colors.accent.DEFAULT,
            color: colors.text.inverse
          }}
        >
          <Plus size={16} />
          New Package
        </button>
      </div>

      {/* Packages List */}
      {loading ? (
        <div style={{ color: colors.text.secondary }}>Loading packages...</div>
      ) : packages.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.DEFAULT
          }}
        >
          <Package size={48} className="mx-auto mb-4" style={{ color: colors.text.secondary }} />
          <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
            No material packages yet
          </p>
          <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
            Create packages to group commonly used materials together
          </p>
          <button
            onClick={() => openPackageModal()}
            className="px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
            style={{
              backgroundColor: colors.accent.DEFAULT,
              color: colors.text.inverse
            }}
          >
            <Plus size={16} />
            Create Your First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onEdit={() => openPackageModal(pkg)}
              onDelete={() => handleDeletePackage(pkg.id)}
              onClone={() => handleClonePackage(pkg)}
            />
          ))}
        </div>
      )}

      {/* Package Edit Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: colors.background.card }}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                  {editingPackage ? 'Edit Package' : 'New Package'}
                </h2>
                <button
                  onClick={closePackageModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Package Details Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    placeholder="e.g., Kitchen Cabinets Package"
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: colors.background.main,
                      borderColor: colors.border.DEFAULT,
                      color: colors.text.primary
                    }}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={packageForm.category}
                      onChange={(e) => setPackageForm({ ...packageForm, category: e.target.value })}
                      placeholder="e.g., Cabinets, Plumbing"
                      className="w-full px-3 py-2 rounded border"
                      style={{
                        backgroundColor: colors.background.main,
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.primary
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                      placeholder="Optional notes"
                      className="w-full px-3 py-2 rounded border"
                      style={{
                        backgroundColor: colors.background.main,
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.primary
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSavePackage}
                  disabled={!packageForm.name}
                  className="px-4 py-2 rounded font-medium disabled:opacity-50"
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                    color: colors.text.inverse
                  }}
                >
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>

              {/* Package Items Section */}
              {currentPackageId && (
                <>
                  <div className="border-t pt-6" style={{ borderColor: colors.border.DEFAULT }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                        Package Items
                      </h3>
                      <button
                        onClick={() => {
                          fetchPriceListItems()
                          setShowItemSelector(true)
                        }}
                        className="px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2"
                        style={{
                          backgroundColor: `${colors.accent.DEFAULT}20`,
                          color: colors.accent.DEFAULT
                        }}
                      >
                        <Plus size={14} />
                        Add from Price List
                      </button>
                    </div>

                    {/* Items Table */}
                    {packageItems.length === 0 ? (
                      <div
                        className="rounded border p-6 text-center"
                        style={{
                          borderColor: colors.border.DEFAULT,
                          backgroundColor: colors.background.main
                        }}
                      >
                        <p className="text-sm" style={{ color: colors.text.secondary }}>
                          No items in package yet. Add items from your price list.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded border overflow-hidden mb-4" style={{ borderColor: colors.border.DEFAULT }}>
                          <table className="w-full text-sm">
                            <thead style={{ backgroundColor: colors.background.hover }}>
                              <tr>
                                <th className="text-left px-3 py-2 font-medium" style={{ color: colors.text.secondary }}>Item</th>
                                <th className="text-center px-3 py-2 font-medium" style={{ color: colors.text.secondary }}>Qty</th>
                                <th className="text-right px-3 py-2 font-medium" style={{ color: colors.text.secondary }}>Unit Cost</th>
                                <th className="text-right px-3 py-2 font-medium" style={{ color: colors.text.secondary }}>Total</th>
                                <th className="text-right px-3 py-2 font-medium" style={{ color: colors.text.secondary }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {packageItems.map(item => (
                                <tr key={item.id} style={{ borderTop: `1px solid ${colors.border.DEFAULT}` }}>
                                  <td className="px-3 py-2">
                                    <div className="font-medium" style={{ color: colors.text.primary }}>{item.item_name}</div>
                                    {item.item_description && (
                                      <div className="text-xs" style={{ color: colors.text.secondary }}>{item.item_description}</div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleUpdateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                      min="0.01"
                                      step="0.01"
                                      className="w-20 px-2 py-1 rounded border text-center"
                                      style={{
                                        backgroundColor: colors.background.main,
                                        borderColor: colors.border.DEFAULT,
                                        color: colors.text.primary
                                      }}
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right" style={{ color: colors.text.primary }}>
                                    ${item.unit_cost.toFixed(2)} / {item.unit}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium" style={{ color: colors.text.primary }}>
                                    ${item.line_total.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="p-1 rounded hover:bg-red-50"
                                      style={{ color: colors.semantic.error }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Total */}
                        <div className="flex justify-end">
                          <div className="text-right">
                            <div className="text-sm mb-1" style={{ color: colors.text.secondary }}>Package Total Cost</div>
                            <div className="text-2xl font-bold" style={{ color: colors.accent.DEFAULT }}>
                              ${calculatePackageTotal().toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Selector Modal */}
      {showItemSelector && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div
            className="rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col"
            style={{ backgroundColor: colors.background.card }}
          >
            <div className="p-4 border-b" style={{ borderColor: colors.border.DEFAULT }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                  Add from Price List
                </h3>
                <button
                  onClick={() => setShowItemSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="flex-1 px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.primary
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredPriceListItems.length === 0 ? (
                <div className="text-center py-8" style={{ color: colors.text.secondary }}>
                  No items found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPriceListItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="border rounded p-3 cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all"
                      style={{ borderColor: colors.border.DEFAULT }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: colors.text.primary }}>{item.name}</div>
                          {item.description && (
                            <div className="text-sm" style={{ color: colors.text.secondary }}>{item.description}</div>
                          )}
                          <div className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                            ${item.cost.toFixed(2)} / {item.unit}
                            {item.category && <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded">{item.category}</span>}
                          </div>
                        </div>
                        <button
                          className="px-3 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: colors.accent.DEFAULT,
                            color: colors.text.inverse
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Package Card Component
function PackageCard({ 
  package: pkg, 
  onEdit, 
  onDelete, 
  onClone 
}: { 
  package: MaterialPackage
  onEdit: () => void
  onDelete: () => void
  onClone: () => void
}) {
  const [itemCount, setItemCount] = useState<number>(0)
  const [totalCost, setTotalCost] = useState<number>(0)

  useEffect(() => {
    fetchPackageStats()
  }, [pkg.id])

  const fetchPackageStats = async () => {
    const { data } = await supabase
      .from('material_package_items')
      .select('line_total')
      .eq('package_id', pkg.id)

    if (data) {
      setItemCount(data.length)
      setTotalCost(data.reduce((sum, item) => sum + (item.line_total || 0), 0))
    }
  }

  return (
    <div
      className="rounded-lg border p-4 hover:shadow-md transition-shadow"
      style={{
        backgroundColor: colors.background.card,
        borderColor: colors.border.DEFAULT
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold mb-1" style={{ color: colors.text.primary }}>
            {pkg.name}
          </h3>
          {pkg.category && (
            <div className="text-xs px-2 py-0.5 bg-gray-100 rounded inline-block mb-2" style={{ color: colors.text.secondary }}>
              {pkg.category}
            </div>
          )}
          {pkg.description && (
            <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              {pkg.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-sm">
        <div>
          <span style={{ color: colors.text.secondary }}>Items: </span>
          <span className="font-medium" style={{ color: colors.text.primary }}>{itemCount}</span>
        </div>
        <div>
          <span style={{ color: colors.text.secondary }}>Cost: </span>
          <span className="font-semibold" style={{ color: colors.accent.DEFAULT }}>${totalCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-1.5 rounded text-sm font-medium flex items-center justify-center gap-1"
          style={{
            backgroundColor: `${colors.accent.DEFAULT}20`,
            color: colors.accent.DEFAULT
          }}
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button
          onClick={onClone}
          className="px-3 py-1.5 rounded text-sm"
          style={{
            backgroundColor: colors.background.hover,
            color: colors.text.primary
          }}
          title="Clone package"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded text-sm"
          style={{
            backgroundColor: `${colors.semantic.error}20`,
            color: colors.semantic.error
          }}
          title="Delete package"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
