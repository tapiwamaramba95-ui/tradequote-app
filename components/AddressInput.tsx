'use client'

import { useState, useEffect } from 'react'

interface AddressInputProps {
  value?: string
  onChange: (address: string) => void
  onStructuredChange?: (address: { street: string, suburb: string, state: string, postcode: string }) => void
  required?: boolean
  disabled?: boolean
}

export default function AddressInput({ 
  value = '', 
  onChange, 
  onStructuredChange,
  required = false,
  disabled = false 
}: AddressInputProps) {
  const [street, setStreet] = useState('')
  const [suburb, setSuburb] = useState('')
  const [state, setState] = useState('')
  const [postcode, setPostcode] = useState('')

  // Parse existing address on mount
  useEffect(() => {
    if (value && value.trim()) {
      const lines = value.split('\n').map(l => l.trim()).filter(Boolean)
      
      if (lines.length >= 1) {
        setStreet(lines[0] || '')
        
        if (lines.length >= 2) {
          // Parse "Melbourne VIC 3000" format
          const parts = lines[1].split(' ').filter(Boolean)
          if (parts.length >= 3) {
            setPostcode(parts[parts.length - 1] || '')
            setState(parts[parts.length - 2] || '')
            setSuburb(parts.slice(0, -2).join(' ') || '')
          }
        }
      } else if (lines.length === 1) {
        // Handle single-line comma-separated addresses like "123 Main St, Melbourne VIC 3000"
        const fullAddress = lines[0]
        const commaIndex = fullAddress.lastIndexOf(',')
        
        if (commaIndex > 0) {
          const streetPart = fullAddress.substring(0, commaIndex).trim()
          const locationPart = fullAddress.substring(commaIndex + 1).trim()
          
          setStreet(streetPart)
          
          // Parse the location part "Melbourne VIC 3000"
          const locationParts = locationPart.split(' ').filter(Boolean)
          if (locationParts.length >= 3) {
            setPostcode(locationParts[locationParts.length - 1] || '')
            setState(locationParts[locationParts.length - 2] || '')
            setSuburb(locationParts.slice(0, -2).join(' ') || '')
          } else if (locationParts.length === 2) {
            setState(locationParts[0] || '')
            setPostcode(locationParts[1] || '')
          }
        } else {
          // Just a street address without location info
          setStreet(fullAddress)
        }
      }
    }
  }, [value])

  // Title case helper
  const toTitleCase = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Update parent whenever fields change
  useEffect(() => {
    // Always call the structured change callback if provided
    if (onStructuredChange) {
      onStructuredChange({
        street: street,
        suburb: suburb, 
        state: state,
        postcode: postcode
      })
    }

    // Maintain backward compatibility with string format
    if (street && suburb && state && postcode) {
      const formatted = `${street}\n${suburb} ${state} ${postcode}`
      onChange(formatted)
    } else if (street || suburb || state || postcode) {
      // Handle partial addresses - save whatever is available
      const parts = []
      if (street) parts.push(street)
      
      // Build location line from available components
      const locationParts = []
      if (suburb) locationParts.push(suburb)
      if (state) locationParts.push(state)
      if (postcode) locationParts.push(postcode)
      
      if (locationParts.length > 0) {
        parts.push(locationParts.join(' '))
      }
      
      onChange(parts.join('\n'))
    } else {
      onChange('')
    }
  }, [street, suburb, state, postcode, onChange, onStructuredChange])

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Street Address {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="45 Workshop Street"
          required={required}
          disabled={disabled}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Suburb {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={suburb}
          onChange={(e) => setSuburb(toTitleCase(e.target.value))}
          placeholder="Melbourne"
          required={required}
          disabled={disabled}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            State {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            required={required}
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select...</option>
            <option value="VIC">VIC</option>
            <option value="NSW">NSW</option>
            <option value="QLD">QLD</option>
            <option value="SA">SA</option>
            <option value="WA">WA</option>
            <option value="TAS">TAS</option>
            <option value="NT">NT</option>
            <option value="ACT">ACT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Postcode {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={postcode}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4)
              setPostcode(cleaned)
            }}
            placeholder="3000"
            maxLength={4}
            required={required}
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Preview */}
      {street && suburb && state && postcode && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-1">Address Preview:</p>
          <p className="text-sm text-gray-900 whitespace-pre-line">
            {street}
            {'\n'}
            {suburb} {state} {postcode}
          </p>
        </div>
      )}
    </div>
  )
}