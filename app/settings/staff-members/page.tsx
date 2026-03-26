"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import Breadcrumb from '@/components/Breadcrumb';
import { getBusinessId } from '@/lib/business';
import { PermissionToggle } from '@/components/permissions/PermissionToggle';
import { StaffPermissions, DEFAULT_PERMISSIONS } from '@/lib/permissions/types';

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
  permissions?: StaffPermissions;
  invited_at?: string;
  accepted_at?: string;
  is_active?: boolean;
};

export default function StaffMembersPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [activeModalTab, setActiveModalTab] = useState<'personal' | 'permissions'>('personal');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [invitingStaffId, setInvitingStaffId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    email: '',
    username: '',
    mobile: '',
    phone: '',
    role: 'Staff',
    billing_rate: 'Standard Labour Rate',
    hourly_cost: 0,
    licence_number: '',
    status: 'active',
    permissions: DEFAULT_PERMISSIONS
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const businessId = await getBusinessId();
    if (!businessId) return;

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (!error && data) setStaff(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSaving(false);
      return;
    }

    const businessId = await getBusinessId();
    if (!businessId) {
      setIsSaving(false);
      return;
    }

    try {
      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update({
            name: formData.name,
            phone: formData.phone,
            mobile: formData.mobile,
            role: formData.role,
            hourly_cost: formData.hourly_cost,
            billing_rate: formData.billing_rate,
            licence_number: formData.licence_number,
            permissions: formData.permissions,
            is_active: formData.status === 'active'
          })
          .eq('id', editingStaff.id);
        
        if (error) {
          console.error('Error updating staff:', error);
          alert(`Failed to update staff: ${error.message}`);
        }
      } else {
        // Create staff record first
        const { data: newStaff, error: staffError } = await supabase
          .from('staff')
          .insert([{
            owner_id: user.id,
            business_id: businessId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            mobile: formData.mobile,
            role: formData.role || 'Staff',
            hourly_cost: formData.hourly_cost,
            billing_rate: formData.billing_rate,
            licence_number: formData.licence_number,
            permissions: formData.permissions || DEFAULT_PERMISSIONS,
            is_active: false // Will be activated when they accept invitation
          }])
          .select()
          .single();
        
        if (staffError) {
          console.error('Error creating staff:', staffError);
          alert(`Failed to create staff: ${staffError.message}`);
          setIsSaving(false);
          return;
        }

        // Send invitation email
        try {
          const inviteResponse = await fetch('/api/staff/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              staffId: newStaff.id,
              email: formData.email,
              name: formData.name,
              businessName: profile?.company_name || 'your team'
            })
          });

          const inviteResult = await inviteResponse.json();

          if (!inviteResponse.ok) {
            console.error('Failed to send invitation:', inviteResult);
            alert(`Staff created but invitation email failed: ${inviteResult.error}`);
          } else {
            alert('Staff member created and invitation sent successfully!');
          }
        } catch (inviteError: any) {
          console.error('Error sending invitation:', inviteError);
          alert(`Staff created but failed to send invitation: ${inviteError.message}`);
        }
      }

      setShowModal(false);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      mobile: '',
      phone: '',
      role: 'Staff',
      billing_rate: 'Standard Labour Rate',
      hourly_cost: 0,
      licence_number: '',
      status: 'active',
      permissions: DEFAULT_PERMISSIONS
    });
    setActiveModalTab('personal');
  };

  const handleResendInvitation = async (staffId: string, email: string, name: string) => {
    setInvitingStaffId(staffId);
    
    try {
      const response = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          email,
          name,
          businessName: profile?.company_name || 'your team'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Failed to resend invitation:', result);
        alert(`Failed to resend invitation: ${result.error}`);
      } else {
        alert('Invitation resent successfully!');
        fetchStaff();
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setInvitingStaffId(null);
    }
  };

  const getInvitationStatus = (member: Staff) => {
    if (member.accepted_at) {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
    if (member.invited_at) {
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Not Invited', color: 'bg-gray-100 text-gray-800' };
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setFormData(member);
    setShowModal(true);
  };

  const handleToggleStatus = async (member: Staff) => {
    const businessId = await getBusinessId();
    if (!businessId) return;
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
          resetForm();
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
                <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 border-b">
                    No {activeTab} staff members yet.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const invitationStatus = getInvitationStatus(member);
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50 border-b"
                    >
                      <td className="px-4 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.email}</div>
                          </div>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invitationStatus.color}`}>
                          {invitationStatus.label}
                        </span>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-cyan-600 hover:text-cyan-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          {!member.accepted_at && member.invited_at && (
                            <button
                              onClick={() => handleResendInvitation(member.id, member.email, member.name)}
                              disabled={invitingStaffId === member.id}
                              className="text-orange-600 hover:text-orange-800 text-sm font-medium disabled:opacity-50"
                              style={{ color: colors.accent.DEFAULT }}
                            >
                              {invitingStaffId === member.id ? 'Sending...' : 'Resend Invite'}
                            </button>
                          )}
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
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                      onClick={() => setActiveModalTab('personal')}
                      className={`pb-3 px-1 border-b-2 ${
                        activeModalTab === 'personal'
                          ? 'border-cyan-600 text-cyan-600'
                          : 'border-transparent text-gray-500'
                      } font-medium text-sm`}
                    >
                      Personal Information
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('permissions')}
                      className={`pb-3 px-1 border-b-2 ${
                        activeModalTab === 'permissions'
                          ? 'border-cyan-600 text-cyan-600'
                          : 'border-transparent text-gray-500'
                      } font-medium text-sm`}
                    >
                      Staff Permissions
                    </button>
                  </div>
                </div>

                {activeModalTab === 'personal' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeModalTab === 'personal' ? (
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
                        disabled={!!editingStaff}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      {editingStaff && (
                        <p className="text-xs text-gray-500 mt-1">
                          Email cannot be changed after invitation is sent
                        </p>
                      )}
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
                        Role
                      </label>
                      <select
                        value={formData.role || 'Staff'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="Staff">Staff</option>
                        <option value="Manager">Manager</option>
                        <option value="Account Owner">Account Owner</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Cost <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.hourly_cost || ''}
                        onChange={(e) => setFormData({ ...formData, hourly_cost: parseFloat(e.target.value) || 0 })}
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

                  {/* Right Column - Info */}
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm text-blue-900 font-medium mb-1">
                            Invitation Process
                          </p>
                          <p className="text-sm text-blue-800">
                            {editingStaff 
                              ? 'Update the information and permissions for this staff member.'
                              : 'An invitation email will be sent to this address. The staff member can accept the invitation and create their password to access the system.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {editingStaff && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-gray-900">Invitation Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Invited:</span>
                            <span className="font-medium text-gray-900">
                              {editingStaff.invited_at ? new Date(editingStaff.invited_at).toLocaleDateString() : 'Not sent'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accepted:</span>
                            <span className="font-medium text-gray-900">
                              {editingStaff.accepted_at ? new Date(editingStaff.accepted_at).toLocaleDateString() : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                ) : (
                  <div>
                    {editingStaff && formData.permissions ? (
                      <PermissionToggle
                        staffMemberId={editingStaff.id}
                        staffName={formData.name || 'Staff Member'}
                        permissions={formData.permissions}
                        onChange={(newPermissions) => setFormData({ ...formData, permissions: newPermissions })}
                        isLoading={isSaving}
                      />
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                        <p>Save the staff member first to configure permissions.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-8 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStaff(null);
                    resetForm();
                  }}
                  className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.accent.DEFAULT }}
                  onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = colors.accent.hover)}
                  onMouseLeave={(e) => !isSaving && (e.currentTarget.style.backgroundColor = colors.accent.DEFAULT)}
                >
                  {isSaving ? (editingStaff ? 'Saving...' : 'Sending Invitation...') : (editingStaff ? 'Save Changes' : 'Send Invitation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
