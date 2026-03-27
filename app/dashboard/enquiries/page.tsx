'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { StatusBadge } from '@/components/StatusBadge'
import Table from '@/components/Table'
import { Inbox, Plus, Search, Settings, Globe, Mail, Phone, Users, PenTool, MessageSquare } from 'lucide-react'

type Enquiry = {
  id: string
  user_id: string
  client_id: string | null
  enquiry_number: string | null
  name: string
  email: string | null
  phone: string | null
  address: string | null
  description: string | null
  message: string | null
  job_type: string | null
  preferred_date: string | null
  status: string
  converted_to_job_id: string | null
  converted_to_quote_id: string | null
  created_at: string
  clients: {
    name: string
    email: string | null
    phone: string | null
    street_address: string | null
    suburb: string | null
    state: string | null
    postcode: string | null
  } | null
  jobs: {
    enquiry_source: string | null
  } | null
}

export default function EnquiriesPage() {
	const [loading, setLoading] = useState(true)
	const [enquiries, setEnquiries] = useState<Enquiry[]>([])
	const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo')
	const [search, setSearch] = useState('')
	const [expandedRow, setExpandedRow] = useState<string | null>(null)

	const toggleRow = (id: string) => {
		setExpandedRow(expandedRow === id ? null : id)
	}

	useEffect(() => {
		loadEnquiries()
	}, [])

	const loadEnquiries = async () => {
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (!user) {
				setLoading(false)
				return
			}

			// Query enquiries table with jobs join to get enquiry_source
			const { data, error } = await supabase
				.from('enquiries')
				.select(`
					*,
					jobs!converted_to_job_id(enquiry_source)
				`)
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })
				.limit(100)

			if (data) {
				// Set enquiries data with null clients
				const transformedData = data.map(item => ({
					...item,
					clients: null
				}))
				setEnquiries(transformedData as Enquiry[])
			}
			if (error) {
				console.error('Database error:', error)
			}
		} catch (error) {
			console.error('Error loading enquiries:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredEnquiries = useMemo(() => {
		if (!search) return enquiries
		
		const searchLower = search.toLowerCase()
		return enquiries.filter(e => {
			return e.name?.toLowerCase().includes(searchLower) ||
				e.email?.toLowerCase().includes(searchLower) ||
				e.phone?.toLowerCase().includes(searchLower) ||
				e.clients?.name?.toLowerCase().includes(searchLower) ||
				e.clients?.email?.toLowerCase().includes(searchLower) ||
				e.clients?.phone?.toLowerCase().includes(searchLower) ||
				e.description?.toLowerCase().includes(searchLower) ||
				e.message?.toLowerCase().includes(searchLower)
		})
	}, [enquiries, search])

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="px-4 sm:px-8 py-6">
				<Breadcrumb items={[{ label: 'Enquiries', href: '/dashboard/enquiries' }]} />
				
				{/* Page Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
					{/* Left: Icon + Title */}
					<div className="flex items-center gap-4">
						{/* Icon Badge */}
						<div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center shadow-sm">
							<MessageSquare className="w-6 h-6 text-orange-600" />
						</div>
						
						{/* Title & Subtitle */}
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Enquiries
							</h1>
							<p className="text-sm text-gray-500 mt-1">
								{enquiries.length} new enquir{enquiries.length === 1 ? 'y' : 'ies'}
							</p>
						</div>
					</div>
					
					{/* Right: Action Button */}
					<button
						onClick={() => window.location.href = '/dashboard/jobs/new-enquiry'}
						className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all w-full sm:w-auto"
						style={{ 
							backgroundColor: colors.accent.DEFAULT,
							boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
						}}
						onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
						onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
					>
						<Plus className="w-4 h-4" />
						New Enquiry
					</button>
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
								placeholder="Search by ENQ number, customer, job, or description..."
								value={search}
								onChange={e => setSearch(e.target.value)}
								className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
								style={{ 
									borderColor: colors.border.DEFAULT,
								color: colors.text.primary
								}}
								onFocus={(e) => {
									e.target.style.borderColor = colors.accent.DEFAULT
									e.target.style.boxShadow = `0 0 0 2px rgba(234, 88, 12, 0.2)`
								}}
								onBlur={(e) => {
									e.target.style.borderColor = colors.border.DEFAULT
									e.target.style.boxShadow = 'none'
								}}
							/>
						</div>
						
						<Link
							href="/dashboard/settings/enquiries"
							className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 w-full sm:w-auto"
							style={{ 
								borderColor: colors.border.DEFAULT,
								color: colors.text.primary 
							}}
						>
							<Settings size={18} />
							Settings
						</Link>
					</div>
				</div>

				{/* Desktop Table */}
				<div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
					<table className="w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-20">
									Enquiry #
								</th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
									Customer
								</th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
								Job
							</th>
							<th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-28">
								Contact
							</th>
							<th className="px-2 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider w-16">
								Source
							</th>
							<th className="px-2 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider w-20">
								Status
							</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredEnquiries.map((enquiry, index) => (
								<React.Fragment key={enquiry.id}>
									{/* Main Row */}
									<tr 
										className="hover:bg-gray-50 cursor-pointer transition-colors"
										onClick={() => toggleRow(enquiry.id)}
									>
										<td className="px-2 py-2 whitespace-nowrap">
											<Link
												href={enquiry.converted_to_job_id ? `/dashboard/jobs/${enquiry.converted_to_job_id}` : `/dashboard/enquiries/${enquiry.id}`}
												className="text-xs font-medium text-purple-600 hover:text-purple-700 font-sans"
											>
												{enquiry.enquiry_number || `ENQ${String(index + 1).padStart(5, '0')}`}
											</Link>
										</td>
										
										<td className="px-2 py-2 whitespace-nowrap">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-6 w-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
													<span className="text-xs font-semibold text-orange-700">
												{(enquiry.clients?.name || enquiry.name)?.charAt(0).toUpperCase() || '?'}
													</span>
												</div>
												<div className="ml-2">
													<div className="text-xs font-medium text-gray-900">
															{enquiry.clients?.name || enquiry.name || 'No client'}
													</div>
												</div>
											</div>
										</td>
										
										<td className="px-2 py-2">
											<div className="text-xs text-gray-500 truncate max-w-[150px]">
												{enquiry.description || enquiry.message || 'No description'}
											</div>
										</td>
										
										<td className="px-2 py-2 whitespace-nowrap">
											<div className="text-xs text-gray-900">{enquiry.clients?.email || enquiry.email || '-'}</div>
											<div className="text-xs text-gray-500">{enquiry.clients?.phone || enquiry.phone || '-'}</div>
										</td>
										
										<td className="px-2 py-2 whitespace-nowrap text-center text-xs">
											{enquiry.jobs?.enquiry_source === 'web_form' && (
												<span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
													<Globe size={12} />
													Web
												</span>
											)}
											{enquiry.jobs?.enquiry_source === 'email' && (
												<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
													<Mail size={12} />
													Email
												</span>
											)}
											{enquiry.jobs?.enquiry_source === 'phone' && (
												<span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
													<Phone size={12} />
													Phone
												</span>
											)}
											{enquiry.jobs?.enquiry_source === 'referral' && (
												<span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
													<Users size={12} />
													Referral
												</span>
											)}
											{!enquiry.jobs?.enquiry_source && '-'}
										</td>
										
										<td className="px-2 py-2 whitespace-nowrap text-center">
											<StatusBadge status={enquiry.status} />
										</td>
									</tr>
							
							{/* Expanded Row - Customer Request */}
							{expandedRow === enquiry.id && (enquiry.description || enquiry.message) && (
								<tr>
									<td colSpan={6} className="px-6 py-4 bg-orange-50 border-t border-orange-200">
										<div className="flex items-start gap-4">
											<div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
												<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
												</svg>
											</div>
											
											<div className="flex-1">
												<h4 className="text-sm font-bold text-orange-900 mb-2">
													Description:
												</h4>
												<p className="text-sm text-orange-800 whitespace-pre-wrap leading-relaxed mb-4">
													{enquiry.description || enquiry.message}
												</p>
												
												<div className="flex gap-2">
													<div className="flex gap-2">
														<Link
														href={enquiry.converted_to_job_id ? `/dashboard/quotes/new?job_id=${enquiry.converted_to_job_id}` : `/dashboard/enquiries/${enquiry.id}`}
														onClick={(e) => e.stopPropagation()}
														className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors"
													>
														Create Quote
													</Link>
													<Link
														href={enquiry.converted_to_job_id ? `/dashboard/jobs/${enquiry.converted_to_job_id}` : `/dashboard/enquiries/${enquiry.id}`}
															onClick={(e) => e.stopPropagation()}
															className="px-3 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
														>
															View Details
														</Link>
													</div>
												</div>
											</div>
											
											<button
												onClick={(e) => {
													e.stopPropagation()
													setExpandedRow(null)
												}}
												className="text-gray-400 hover:text-gray-600"
											>
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
												</svg>
											</button>
										</div>
									</td>
								</tr>
							)}
							
							{/* Show when row is expanded but no description exists */}
							{expandedRow === enquiry.id && !enquiry.description && !enquiry.message && (
								<tr>
									<td colSpan={6} className="px-6 py-4 bg-gray-50 border-t border-gray-200">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
														<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
														</svg>
													</div>
													<span className="text-sm text-gray-500">No description provided for this enquiry.</span>
												</div>
												<button
													onClick={(e) => {
														e.stopPropagation()
														setExpandedRow(null)
													}}
													className="text-gray-400 hover:text-gray-600"
												>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
													</svg>
												</button>
											</div>
										</td>
									</tr>
								)}
							</React.Fragment>
						))}
					</tbody>
				</table>
				
				{/* Empty State */}
				{filteredEnquiries.length === 0 && !loading && (
					<div className="text-center py-12">
					<div className="text-gray-500 mb-2">
						No enquiries found.{' '}
						<Link href="/dashboard/settings/enquiries" className="text-orange-600 hover:underline font-medium">
							Set up your enquiry form →
						</Link>
					</div>
				</div>
			)}
			
			{/* Loading State */}
			{loading && (
				<div className="text-center py-12">
					<div className="text-gray-500">Loading enquiries...</div>
				</div>
			)}
		</div>

		{/* Mobile Cards */}
		<div className="lg:hidden space-y-4">
			{filteredEnquiries.map((enquiry, index) => (
				<div 
					key={enquiry.id}
					className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
				>
					{/* Header */}
					<div className="flex items-start justify-between mb-3">
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
										<span className="text-sm font-semibold text-orange-700">
									{(enquiry.clients?.name || enquiry.name)?.charAt(0).toUpperCase() || '?'}
										</span>
									</div>
									<div>
										<Link
												href={enquiry.converted_to_job_id ? `/dashboard/jobs/${enquiry.converted_to_job_id}` : `/dashboard/enquiries/${enquiry.id}`}
											className="text-sm font-medium text-purple-600 hover:text-purple-700 font-sans"
										>
										ENQ{String(index + 1).padStart(5, '0')}
										</Link>
										<div className="text-xs text-gray-500 mt-1">
											{new Date(enquiry.created_at).toLocaleDateString('en-AU', {
												day: 'numeric',
												month: 'short'
											})}
										</div>
									</div>
								</div>
								<Link
									href={enquiry.converted_to_job_id ? `/dashboard/jobs/${enquiry.converted_to_job_id}` : `/dashboard/enquiries/${enquiry.id}`}
									className="text-orange-600 hover:text-orange-900 text-sm font-medium"
								>
									View
								</Link>
							</div>

							{/* Customer & Subject */}
							<div className="space-y-2 mb-3">
								<div>
									<span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Customer</span>
									<div className="text-sm font-medium text-gray-900 mt-1">
								{enquiry.clients?.name || enquiry.name}
									</div>
								</div>
								<div>
									<span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Job</span>
									<div className="text-sm text-gray-500 mt-1">
										{(() => {
											let addressDisplay = 'No address';
											
											if (enquiry.clients?.street_address || enquiry.clients?.suburb || enquiry.clients?.state || enquiry.clients?.postcode) {
												const parts = [];
												if (enquiry.clients?.street_address) parts.push(enquiry.clients.street_address);
												if (enquiry.clients?.suburb || enquiry.clients?.state || enquiry.clients?.postcode) {
													const locationParts = [enquiry.clients?.suburb, enquiry.clients?.state, enquiry.clients?.postcode].filter(Boolean);
													if (locationParts.length > 0) {
														parts.push(locationParts.join(' '));
													}
												}
												addressDisplay = parts.join(', ');
											}
											
											return addressDisplay;
										})()}
									</div>
								</div>
							</div>

							{/* Contact & Source */}
							<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t border-gray-100">
								<div>
									<span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Contact</span>
									<div className="space-y-1 mt-1">
								<div className="text-sm text-gray-900">{enquiry.clients?.email || enquiry.email || '-'}</div>
								<div className="text-sm text-gray-500">{enquiry.clients?.phone || enquiry.phone || '-'}</div>
									</div>
								</div>
								<div className="flex flex-col items-start sm:items-end">
									<span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Source</span>
								{enquiry.jobs?.enquiry_source === 'web_form' && (
										<span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
											<Globe size={14} />
											Web
										</span>
									)}
									{enquiry.jobs?.enquiry_source === 'email' && (
										<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
											<Mail size={14} />
											Email
										</span>
									)}
									{enquiry.jobs?.enquiry_source === 'phone' && (
										<span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
											<Phone size={14} />
											Phone
										</span>
									)}
									{enquiry.jobs?.enquiry_source === 'referral' && (
										<span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
											<Users size={14} />
											Referral
										</span>
									)}
									{!enquiry.jobs?.enquiry_source && '-'}
								</div>
							</div>

							{/* Description Expandable */}
							{(enquiry.description || enquiry.message) && (
								<>
									<button
										onClick={() => toggleRow(enquiry.id)}
										className="w-full mt-3 pt-3 border-t border-gray-100 text-left"
									>
										<div className="flex items-center justify-between">
											<span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
												Customer Request
											</span>
											<svg 
												className={`w-4 h-4 text-gray-400 transition-transform ${expandedRow === enquiry.id ? 'rotate-180' : ''}`} 
												fill="none" 
												stroke="currentColor" 
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
											</svg>
										</div>
									</button>
									{expandedRow === enquiry.id && (
										<div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
											<div className="flex items-start gap-3">
												<div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
													<svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
													</svg>
												</div>
												<div className="flex-1">
													<p className="text-sm text-orange-800 whitespace-pre-wrap leading-relaxed mb-3">
														{enquiry.description || enquiry.message}
													</p>
													<div className="flex flex-col sm:flex-row gap-2">
														<div className="flex flex-col sm:flex-row gap-2">
															<Link
																href={`/dashboard/quotes/new?job_id=${enquiry.id}`}
																className="inline-flex items-center justify-center px-3 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors"
															>
																Create Quote
															</Link>
															<Link
																href={`/dashboard/jobs/${enquiry.id}`}
																className="inline-flex items-center justify-center px-3 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
															>
																View Details
															</Link>
														</div>
													</div>
												</div>
											</div>
										</div>
									)}
								</>
							)}
						</div>
					))}
					
					{/* Empty State */}
					{filteredEnquiries.length === 0 && !loading && (
						<div className="text-center py-12 bg-white rounded-lg border border-gray-200">
							<div className="text-gray-500 mb-2">
								No enquiries found.{' '}
								<Link href="/dashboard/settings/enquiries" className="text-orange-600 hover:underline font-medium">
									Set up your enquiry form →
								</Link>
							</div>
						</div>
					)}
					
					{/* Loading State */}
					{loading && (
						<div className="text-center py-12 bg-white rounded-lg border border-gray-200">
							<div className="text-gray-500">Loading enquiries...</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
