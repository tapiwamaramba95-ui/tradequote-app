"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import Breadcrumb from '@/components/Breadcrumb';

export type Staff = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  username?: string;
  role?: string;
  status?: string;
  hourly_cost?: number;
  billing_rate?: string;
  licence_number?: string;
  permissions?: {
    timesheets?: boolean;
    jobs?: boolean;
    invoicing?: boolean;
    quoting?: boolean;
    purchases?: boolean;
    reports_financials?: boolean;
    scheduling_dispatch?: boolean;
    enquiries?: boolean;
    staff_tracking?: boolean;
    settings?: boolean;
    staff_members?: boolean;
    plan_billing?: boolean;
  };
};

export default function StaffMembersPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    email: '',
    username: '',
    mobile: '',
    phone: '',
    role: 'Account Owner',
    billing_rate: 'Standard Labour Rate',
    hourly_cost: 0,
    licence_number: '',
    status: 'active',
    permissions: {
      timesheets: true,
      jobs: true,
      invoicing: true,
      quoting: true,
      purchases: true,
      reports_financials: true,
      scheduling_dispatch: true,
      enquiries: true,
      staff_tracking: true,
      settings: true,
      staff_members: true,
      plan_billing: true,
    }
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) setStaff(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingStaff) {
      // Update existing staff
      const { error } = await supabase
        .from('staff')
        .update(formData)
        .eq('id', editingStaff.id);
      
      if (error) {
        console.error('Error updating staff:', error);
      }
    } else {
      // Create new staff
      const { error } = await supabase
        .from('staff')
        .insert([{ ...formData, user_id: user.id }]);
      
      if (error) {
        console.error('Error creating staff:', error);
      }
    }

    setShowModal(false);
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      mobile: '',
      phone: '',
      role: 'Account Owner',
      billing_rate: 'Standard Labour Rate',
      hourly_cost: 0,
      licence_number: '',
      status: 'active',
      permissions: {}
    });
    fetchStaff();
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setFormData(member);
    setShowModal(true);
  };

  const handleToggleStatus = async (member: Staff) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('staff')
      .update({ status: newStatus })
      .eq('id', member.id);
    
    if (!error) fetchStaff();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredStaff = staff.filter(s => s.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Staff Members', href: '/settings/staff-members' }
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff Members</h1>
        <p className="text-sm text-gray-600">
          Manage staff member information, user permissions and access to Tradify. Adding pay rates to staff members will enable more accurate job cost reporting.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-cyan-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-cyan-800">
            During your trial there is no limit on the number of staff members you can create.
          </p>
        </div>
      </div>

      {/* New Staff Button */}
      <button
        onClick={() => {
          setEditingStaff(null);
          setFormData({
            name: '',
            email: '',
            username: '',
            mobile: '',
            phone: '',
            role: 'Account Owner',
            billing_rate: 'Standard Labour Rate',
            hourly_cost: 0,
            licence_number: '',
            status: 'active',
            permissions: {
              timesheets: true,
              jobs: true,
              invoicing: true,
              quoting: true,
              purchases: true,
              reports_financials: true,
              scheduling_dispatch: true,
              enquiries: true,
              staff_tracking: true,
              settings: true,
              staff_members: true,
              plan_billing: true,
            }
          });
          setShowModal(true);
        }}
        className="mb-6 inline-flex items-center rounded bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        New Staff Member
      </button>

      {/* Tabs */}
      <div className="bg-white border-b mb-6">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'active'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active ({staff.filter(s => s.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'inactive'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Inactive ({staff.filter(s => s.status === 'inactive').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Name</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Role</th>
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400 border-b">
                    No {activeTab} staff members yet.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 border-b cursor-pointer"
                    onClick={() => handleEdit(member)}
                  >
                    <td className="px-4 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(member.name)}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap text-gray-700">
                      <div className="flex items-center gap-2">
                        {member.role || '-'}
                        {member.role === 'Account Owner' && (
                          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(member);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          member.status === 'active' ? 'bg-orange-500' : 'bg-gray-200'
                        }`}
                        style={member.status === 'active' ? { backgroundColor: colors.accent.DEFAULT } : {}}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            member.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900/20 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-2xl">
                  {formData.name ? getInitials(formData.name) : 'TM'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {formData.name || 'New Staff Member'}
                  </h2>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-8 py-6">
                {/* Tabs */}
                <div className="border-b mb-6">
                  <div className="flex gap-6">
                    <button
                      type="button"
                      className="pb-3 px-1 border-b-2 border-cyan-600 text-cyan-600 font-medium text-sm"
                    >
                      Personal Information
                    </button>
                    <button
                      type="button"
                      className="pb-3 px-1 border-b-2 border-transparent text-gray-500 font-medium text-sm"
                    >
                      External Calendars
                    </button>
                    <button
                      type="button"
                      className="pb-3 px-1 border-b-2 border-transparent text-gray-500 font-medium text-sm"
                    >
                      Notifications
                    </button>
                    <button
                      type="button"
                      className="pb-3 px-1 border-b-2 border-transparent text-gray-500 font-medium text-sm"
                    >
                      Staff Permissions
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Personal Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.username || formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <button type="button" className="text-cyan-600 hover:underline">
                          Learn about changing usernames.
                        </button>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                      <input
                        type="text"
                        value={formData.mobile || ''}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Billing Rate <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.billing_rate || 'Standard Labour Rate'}
                          onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button
                          type="button"
                          className="px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Cost <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.hourly_cost || ''}
                        onChange={(e) => setFormData({ ...formData, hourly_cost: parseFloat(e.target.value) })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Licence Number <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.licence_number || ''}
                        onChange={(e) => setFormData({ ...formData, licence_number: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Right Column - Staff Permissions */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Staff Permissions</h3>
                    
                    <div className="space-y-3">
                      {[
                        { key: 'timesheets', label: 'Timesheets', icon: '⏱️' },
                        { key: 'jobs', label: 'Jobs', icon: '📋' },
                        { key: 'invoicing', label: 'Invoicing', icon: '📄' },
                        { key: 'quoting', label: 'Quoting', icon: '💰' },
                        { key: 'purchases', label: 'Purchases', icon: '🛒' },
                        { key: 'reports_financials', label: 'Reports & Financials', icon: '📊' },
                        { key: 'scheduling_dispatch', label: 'Scheduling & Dispatch', icon: '📅' },
                        { key: 'enquiries', label: 'Enquiries', icon: '📧' },
                        { key: 'staff_tracking', label: 'Staff Tracking', icon: '📍' },
                        { key: 'settings', label: 'Settings', icon: '⚙️' },
                        { key: 'staff_members', label: 'Staff Members', icon: '👥' },
                        { key: 'plan_billing', label: 'Plan & Billing', icon: '💳' },
                      ].map((permission) => (
                        <label
                          key={permission.key}
                          className="flex items-center gap-3 p-3 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions?.[permission.key as keyof typeof formData.permissions] || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  [permission.key]: e.target.checked,
                                },
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className="flex-1 text-sm text-gray-700">
                            {permission.label}
                          </span>
                          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </label>
                      ))}
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">No Access</span> - This staff member has no permissions enabled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-8 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStaff(null);
                  }}
                  className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded text-white font-semibold transition-colors"
                  style={{ backgroundColor: colors.accent.DEFAULT }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
