"use client";
import Breadcrumb from '@/components/Breadcrumb';
import Table from '@/components/Table';
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
  address: string
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

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-8">
        <Breadcrumb items={[{ label: 'Clients' }]} />
        <div className="p-6">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Clients', href: '/dashboard/clients' }]} />
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
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
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all"
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
        <div className="flex items-center gap-3">
          <div className="flex flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} style={{ color: colors.text.muted }} />
            </div>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                borderColor: colors.border.DEFAULT,
                color: colors.text.primary 
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={[
            {
              key: 'name',
              label: 'Name',
              align: 'left',
              width: '20%',
              render: (client: Client) => (
                <Link href={`/dashboard/clients/${client.id}`} className="hover:underline font-medium text-blue-700">
                  {client.name}
                </Link>
              )
            },
            {
              key: 'email',
              label: 'Email',
              align: 'left',
              width: '25%',
              render: (client: Client) => (
                <div className="truncate max-w-[200px]" title={client.email}>
                  {client.email}
                </div>
              )
            },
            {
              key: 'phone',
              label: 'Phone',
              align: 'center',
              width: '15%',
              render: (client: Client) => client.phone
            },
            {
              key: 'address',
              label: 'Address',
              align: 'left',
              width: '30%',
              render: (client: Client) => {
                // Display structured address if available, otherwise legacy address
                if (client.street_address || client.suburb || client.state || client.postcode) {
                  const parts = [];
                  if (client.street_address) parts.push(client.street_address);
                  if (client.suburb || client.state || client.postcode) {
                    const locationParts = [client.suburb, client.state, client.postcode].filter(Boolean);
                    if (locationParts.length > 0) {
                      parts.push(locationParts.join(' '));
                    }
                  }
                  return (
                    <div className="text-sm">
                      {parts.map((part, index) => (
                        <div key={index} className="truncate">{part}</div>
                      ))}
                    </div>
                  );
                }
                return <div className="truncate" title={client.address}>{client.address || ''}</div>;
              }
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'center',
              width: '10%',
              render: (client: Client) => (
                <Link 
                  href={`/dashboard/clients/${client.id}`} 
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-semibold transition-colors"
                >
                  <Eye size={16} />
                  View
                </Link>
              )
            }
          ]}
          data={clients.filter(client => 
            !search || 
            client.name?.toLowerCase().includes(search.toLowerCase()) ||
            client.email?.toLowerCase().includes(search.toLowerCase()) ||
            client.phone?.toLowerCase().includes(search.toLowerCase())
          )}
          loading={loading}
          emptyMessage="No clients yet. Add your first client!"
        />
      </div>
    </div>
  );
}