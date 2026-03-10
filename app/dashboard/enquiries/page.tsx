'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { StatusBadge } from '@/components/StatusBadge'
import Table from '@/components/Table'
import { Inbox, Plus, Search, Settings, Globe, Mail, Phone, Users, PenTool, MessageSquare } from 'lucide-react'

type EnquiryJob = {
  id: string
  job_name: string
  street_address: string | null
  suburb: string | null
  state: string | null
  postcode: string | null
  description: string | null
  enquiry_source: string | null
  enquiry_number: string | null
  status: string
  created_at: string
  clients: {
    name: string
    email: string | null
    phone: string | null
    address: string | null
    street_address: string | null
    suburb: string | null
    state: string | null
    postcode: string | null
  } | null
}

export default function EnquiriesPage() {
	const [loading, setLoading] = useState(true)
	const [enquiries, setEnquiries] = useState<EnquiryJob[]>([])
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

			// Query jobs table for enquiries (status = 'enquiry')
			const { data, error } = await supabase
				.from('jobs')
				.select('id, job_name, street_address, suburb, state, postcode, description, enquiry_source, enquiry_number, status, created_at, clients(name, email, phone, address, street_address, suburb, state, postcode)')
				.eq('user_id', user.id)
				.eq('status', 'enquiry')
				.order('created_at', { ascending: false })

			if (data) {
				console.log('Enquiry data:', data)
				// Transform the data to match our type expectations
				const transformedData = data.map(item => ({
					...item,
					clients: Array.isArray(item.clients) && item.clients.length > 0 
						? item.clients[0] 
						: null
				}))
				setEnquiries(transformedData as EnquiryJob[])
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

	const filteredEnquiries = enquiries.filter(e => {
		const matchesSearch = !search || 
			e.enquiry_number?.toLowerCase().includes(search.toLowerCase()) ||
			e.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
			e.clients?.email?.toLowerCase().includes(search.toLowerCase()) ||
			e.clients?.phone?.toLowerCase().includes(search.toLowerCase()) ||
			e.job_name.toLowerCase().includes(search.toLowerCase()) ||
			e.description?.toLowerCase().includes(search.toLowerCase())
		return matchesSearch
	})

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
			</div>
		)
	}

	return (
		<div className="w-full px-4 sm:px-6 lg:px-8 py-8">
			<Breadcrumb items={[{ label: 'Enquiries', href: '/dashboard/enquiries' }]} />
			
			{/* Page Header */}
			<div className="flex items-center justify-between mb-6">
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
					className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-all"
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
				<div className="flex items-center gap-3">
					<div className="flex flex-1 max-w-md relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search size={18} style={{ color: colors.text.muted }} />
						</div>
						<input
							type="text"
							placeholder="Search by ENQ number, name, email, phone, or job..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							style={{ 
								borderColor: colors.border.DEFAULT,
								color: colors.text.primary 
							}}
						/>
					</div>
					
					<Link
						href="/dashboard/settings/enquiries"
						className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
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

			{/* Table */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
								Enquiry #
							</th>
							<th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
								Customer
							</th>
							<th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
								Job
							</th>
							<th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
								Contact
							</th>
							<th className="px-6 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
								Source
							</th>
							<th className="px-6 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
								Received
							</th>
							<th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredEnquiries.map((enquiry) => (
							<React.Fragment key={enquiry.id}>
								{/* Main Row */}
								<tr 
									className="hover:bg-gray-50 cursor-pointer transition-colors"
									onClick={() => toggleRow(enquiry.id)}
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">
											<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
											</svg>
											{enquiry.enquiry_number || `ENQ${enquiry.id.slice(0, 4)}`}
											{enquiry.description && (
												<svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
												</svg>
											)}
										</span>
									</td>
									
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-full flex items-center justify-center">
												<span className="text-sm font-semibold text-cyan-700">
													{enquiry.clients?.name?.charAt(0).toUpperCase() || '?'}
												</span>
											</div>
											<div className="ml-3">
												<div className="text-sm font-medium text-gray-900">
													{enquiry.clients?.name || 'No client'}
												</div>
											</div>
										</div>
									</td>
									
									<td className="px-6 py-4">
										<div className="text-sm font-medium text-gray-900">{enquiry.job_name}</div>
										<div className="text-sm text-gray-500">
											{(() => {
												// Display client address only
												let addressDisplay = 'No address';
												
												// Check client's structured address first
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
												// Fall back to client's legacy address
												else if (enquiry.clients?.address) {
													addressDisplay = enquiry.clients.address;
												}
												
												return addressDisplay;
											})()}
										</div>
									</td>
									
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900">{enquiry.clients?.email || '-'}</div>
										<div className="text-sm text-gray-500">{enquiry.clients?.phone || '-'}</div>
									</td>
									
									<td className="px-6 py-4 whitespace-nowrap text-center text-sm">
										{enquiry.enquiry_source === 'website_form' && (
											<span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
												<Globe size={14} />
												Web
											</span>
										)}
										{enquiry.enquiry_source === 'email' && (
											<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
												<Mail size={14} />
												Email
											</span>
										)}
										{enquiry.enquiry_source === 'phone_call' && (
											<span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
												<Phone size={14} />
												Phone
											</span>
										)}
										{enquiry.enquiry_source === 'referral' && (
											<span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
												<Users size={14} />
												Referral
											</span>
										)}
										{!enquiry.enquiry_source && '-'}
									</td>
									
									<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
										{new Date(enquiry.created_at).toLocaleDateString('en-AU', {
											day: 'numeric',
											month: 'short'
										})}
									</td>
									
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<Link
											href={`/dashboard/jobs/${enquiry.id}`}
											onClick={(e) => e.stopPropagation()}
											className="text-cyan-600 hover:text-cyan-900"
										>
											View
										</Link>
									</td>
								</tr>
								
								{/* Expanded Row - Customer Request */}
								{expandedRow === enquiry.id && enquiry.description && (
									<tr>
										<td colSpan={7} className="px-6 py-4 bg-blue-50 border-t border-blue-200">
											<div className="flex items-start gap-4">
												<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
													<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
													</svg>
												</div>
												
												<div className="flex-1">
													<h4 className="text-sm font-bold text-blue-900 mb-2">
														Customer's Request:
													</h4>
													<p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed mb-4">
														{enquiry.description}
													</p>
													
													<div className="flex gap-2">
														<Link
															href={`/dashboard/quotes/new?job_id=${enquiry.id}`}
															onClick={(e) => e.stopPropagation()}
															className="px-3 py-1.5 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
														>
															Create Quote
														</Link>
														<Link
															href={`/dashboard/jobs/${enquiry.id}`}
															onClick={(e) => e.stopPropagation()}
															className="px-3 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
														>
															View Full Details
														</Link>
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
								{expandedRow === enquiry.id && !enquiry.description && (
									<tr>
										<td colSpan={7} className="px-6 py-4 bg-gray-50 border-t border-gray-200">
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
							<Link href="/dashboard/settings/enquiries" className="text-blue-600 hover:underline font-medium">
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
		</div>
	)
}
