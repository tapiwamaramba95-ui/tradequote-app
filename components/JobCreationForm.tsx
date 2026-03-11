import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import AddressInput from '@/components/AddressInput';

export interface JobCreationFormProps {
  onJobCreated: (job: any) => void;
  onClose: () => void;
}

export default function JobCreationForm({ onJobCreated, onClose }: JobCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    street_address: '',
    suburb: '',
    state: '',
    postcode: '',
    scheduled_date: '',
    description: '',
    status: 'quoted',
    total_amount: '',
    reference: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*, street_address, suburb, state, postcode')
      .order('name');
    setClients(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in');
      setLoading(false);
      return;
    }

    // Fetch business settings to get job numbering config
    const { data: settings } = await supabase
      .from('business_settings')
      .select('job_prefix, job_start_number')
      .eq('user_id', user.id)
      .single();

    // Get count of existing jobs to determine next number
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Generate job number
    const jobPrefix = settings?.job_prefix || 'J';
    const startNumber = settings?.job_start_number || 1;
    const nextNumber = (count || 0) + startNumber;
    const jobNumber = `${jobPrefix}${String(nextNumber).padStart(5, '0')}`;

    const { data, error } = await supabase.from('jobs').insert([
      {
        user_id: user.id,
        job_number: jobNumber,
        title: formData.title,
        client_id: formData.client_id || null,
        street_address: formData.street_address || null,
        suburb: formData.suburb || null,
        state: formData.state || null,
        postcode: formData.postcode || null,
        scheduled_date: formData.scheduled_date || null,
        description: formData.description,
        status: formData.status,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        reference: formData.reference,
      }
    ]).select('*');
    if (error) {
      alert('Error creating job: ' + error.message);
      setLoading(false);
    } else if (data && data.length > 0) {
      onJobCreated(data[0]);
      setLoading(false);
    }
  };

  // Memoize the structured address change handler
  const handleStructuredAddressChange = useCallback((structured: any) => {
    setFormData(prev => ({ 
      ...prev, 
      street_address: structured.street || '',
      suburb: structured.suburb || '',
      state: structured.state || '',
      postcode: structured.postcode || ''
    }))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectClient = (client: any) => {
    const clientUpdate = { 
      ...formData, 
      client_id: client.id
    };
    
    // Use client's structured address fields if available
    if (client.street_address || client.suburb || client.state || client.postcode) {
      clientUpdate.street_address = client.street_address || '';
      clientUpdate.suburb = client.suburb || '';
      clientUpdate.state = client.state || '';
      clientUpdate.postcode = client.postcode || '';
    }
    
    setFormData(clientUpdate);
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  const selectedClient = clients.find(c => c.id === formData.client_id);

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 p-8">
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-semibold mb-6">New Job</h2>
        <div className="space-y-6">
          {/* Customer Search */}
          <div>
            <label className="block text-sm font-medium mb-1">Customer *</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input type="text" value={clientSearch} onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} placeholder="Search or Add Customer" className="w-full rounded-md px-3 py-2 border" />
                {showClientDropdown && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-md shadow-lg border max-h-60 overflow-auto bg-white">
                    {filteredClients.map(client => (
                      <button key={client.id} type="button" onClick={() => selectClient(client)} className="w-full text-left px-4 py-2 hover:bg-gray-50">
                        <div className="font-medium text-sm">{client.name}</div>
                        {client.email && <div className="text-xs text-gray-500">{client.email}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {selectedClient && (
              <div className="mt-2 p-3 rounded-md bg-gray-50">
                <div className="text-sm font-medium">{selectedClient.name}</div>
                {selectedClient.phone && <div className="text-xs text-gray-600">{selectedClient.phone}</div>}
              </div>
            )}
          </div>
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Job Name</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="E.g. Kitchen Renovation, Roof Repair (optional)" className="w-full rounded-md px-3 py-2 border" />
          </div>
          {/* Address & Reference Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Address</label>
              <p className="text-xs text-gray-500 mb-2">Enter the address where work will be performed</p>
              <AddressInput
                value=""
                onChange={(address) => {
                  // Handle simple string address updates
                  setFormData(prev => ({ ...prev, address }))
                }} 
                onStructuredChange={handleStructuredAddressChange}
                initialStructured={{
                  street_address: formData.street_address,
                  suburb: formData.suburb,
                  state: formData.state,
                  postcode: formData.postcode
                }}
                required={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reference</label>
              <input type="text" name="reference" value={formData.reference} onChange={handleChange} placeholder="Job reference or PO number" className="w-full rounded-md px-3 py-2 border" />
            </div>
          </div>
          {/* Scheduled Date & Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Date</label>
              <input type="date" name="scheduled_date" value={formData.scheduled_date} onChange={handleChange} className="w-full rounded-md px-3 py-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-md px-3 py-2 border">
                <option value="quoted">Quoted</option>
                <option value="approved">Approved</option>
                <option value="scheduled_measure_quote">Scheduled for Measure & Quote</option>
                <option value="scheduled_work">Scheduled for Work</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          {/* Estimated Value */}
          <div>
            <label className="block text-sm font-medium mb-1">Estimated Value</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
              <input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} placeholder="0.00" step="0.01" className="w-full rounded-md pl-7 pr-3 py-2 border" />
            </div>
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Describe the scope of work..." className="w-full rounded-md px-3 py-2 border" />
          </div>
        </div>
        <div className="flex gap-4 mt-8 justify-end">
          <button type="button" className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2 rounded text-white font-semibold" style={{ backgroundColor: '#ea580c' }}>{loading ? 'Saving...' : 'Save Job'}</button>
        </div>
      </form>
    </div>
  );
}
