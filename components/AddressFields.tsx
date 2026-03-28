'use client'

import { ChevronDown } from 'lucide-react'

interface AddressFieldsProps {
  streetAddress: string
  suburb: string
  state: string
  postcode: string
  onStreetAddressChange: (value: string) => void
  onSuburbChange: (value: string) => void
  onStateChange: (value: string) => void
  onPostcodeChange: (value: string) => void
  required?: boolean
}

export function AddressFields({
  streetAddress,
  suburb,
  state,
  postcode,
  onStreetAddressChange,
  onSuburbChange,
  onStateChange,
  onPostcodeChange,
  required = false
}: AddressFieldsProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-base font-medium text-gray-700 mb-2">
          Street Address {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={streetAddress}
          onChange={(e) => onStreetAddressChange(e.target.value)}
          className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-11"
          placeholder="45 Workshop Street"
          required={required}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-base font-medium text-gray-700 mb-2">
            Suburb {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={suburb}
            onChange={(e) => onSuburbChange(e.target.value)}
            className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-11"
            placeholder="Melbourne"
            required={required}
          />
        </div>

        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            State {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-11"
            required={required}
          >
            <option value="">Select...</option>
            <option value="NSW">NSW</option>
            <option value="VIC">VIC</option>
            <option value="QLD">QLD</option>
            <option value="SA">SA</option>
            <option value="WA">WA</option>
            <option value="TAS">TAS</option>
            <option value="NT">NT</option>
            <option value="ACT">ACT</option>
          </select>
        </div>
      </div>

      <div className="max-w-xs">
        <label className="block text-base font-medium text-gray-700 mb-2">
          Postcode {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={postcode}
          onChange={(e) => onPostcodeChange(e.target.value)}
          maxLength={4}
          pattern="[0-9]{4}"
          className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-11"
          placeholder="3000"
          required={required}
        />
      </div>
    </div>
  )
}
