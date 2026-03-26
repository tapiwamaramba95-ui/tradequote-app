"use client";
import Breadcrumb from '@/components/Breadcrumb';
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Users, Plus, Search, Eye } from 'lucide-react'
import { colors } from '@/lib/colors'

type Client = {
  id: string
  name: string
  email: string
  phone: string
  street_address: string
  suburb: string
  state: string
  postcode: string
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*, street_address, suburb, state, postcode')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const filteredClients = clients.filter(client => 
    !search || 
    client.name?.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-8 py-6">
        <Breadcrumb items={[{ label: 'Clients', href: '/dashboard/clients' }]} />
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4">
            {/* Icon Badge */}
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Clients
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {clients.length} {clients.length === 1 ? 'client' : 'clients'} in your database
              </p>
            </div>
          </div>
          
          {/* Right: Action Button */}
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all w-full sm:w-auto"
            style={{ 
              backgroundColor: colors.accent.DEFAULT,
              boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
          >
            <Plus className="w-4 h-4" />
            New Client
          </Link>
        </div>
        
        {/* Search Toolbar */}
        <div 
          className="bg-white rounded-lg shadow-sm border p-4 mb-6" 
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex flex-1 w-full max-w-full sm:max-w-md relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} style={{ color: colors.text.muted }} />
              </div>
              <input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.primary
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent.DEFAULT
                  e.currentTarget.style.boxShadow = `0 0 0 2px rgba(234, 88, 12, 0.2)`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.DEFAULT
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500 mb-2">
                        {search ? 'No clients found matching your search' : 'No clients yet'}
                      </p>
                      {!search && (
                        <Link
                          href="/dashboard/clients/new"
                          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                        >
                          Add your first client →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 py-2 whitespace-nowrap">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700"
                      >
                        {client.name}
                      </Link>
                    </td>
                    
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{client.email || '-'}</div>
                    </td>
                    
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{client.phone || '-'}</div>
                    </td>
                    
                    <td className="px-2 py-2">
                      {(client.street_address || client.suburb || client.state || client.postcode) ? (
                        <div className="text-xs text-gray-900">
                          {client.street_address && <div>{client.street_address}</div>}
                          {(client.suburb || client.state || client.postcode) && (
                            <div className="text-gray-500">
                              {[client.suburb, client.state, client.postcode].filter(Boolean).join(' ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">No address</div>
                      )}
                    </td>
                    
                    <td className="px-2 py-2 whitespace-nowrap text-right text-xs font-medium">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-2 text-center">
                  {search ? 'No clients found matching your search' : 'No clients yet'}
                </p>
                {!search && (
                  <Link
                    href="/dashboard/clients/new"
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Add your first client →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            filteredClients.map((client) => (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-purple-600 mb-1">
                      {client.name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
                      Email
                    </span>
                    <div className="text-gray-900 truncate">{client.email || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
                      Phone
                    </span>
                    <div className="text-gray-900">{client.phone || '-'}</div>
                  </div>
                </div>

                {(client.street_address || client.suburb || client.state || client.postcode) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
                      Address
                    </span>
                    <div className="text-sm text-gray-900">
                      {client.street_address && <div>{client.street_address}</div>}
                      {(client.suburb || client.state || client.postcode) && (
                        <div className="text-gray-500">
                          {[client.suburb, client.state, client.postcode].filter(Boolean).join(' ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}