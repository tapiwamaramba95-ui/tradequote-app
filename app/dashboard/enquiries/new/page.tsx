
"use client";

import { useState, useCallback } from 'react';
import { AddressFields } from '@/components/AddressFields';
import Link from 'next/link';
import { formatAustralianPhone, isValidAustralianPhone, normalizeEmail, isValidEmail, suggestEmailCorrection } from '@/lib/utils/formatters'

export default function NewEnquiryPage() {
	const [form, setForm] = useState({
		name: '',
		phone: '',
		email: '',
		street_address: '',
		suburb: '',
		state: '',
		postcode: '',
		description: '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Save enquiry to backend
		alert('Enquiry submitted!');
	};

	return (
		<div className="bg-gray-50 min-h-screen p-8">
			<div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
				<Link href="/enquiries" className="hover:underline">Enquiries</Link>
				<span>&gt;</span>
				<span>New enquiry</span>
			</div>
			<div className="bg-white rounded shadow p-8 max-w-3xl mx-auto">
				<h1 className="text-2xl font-bold mb-8">New enquiry</h1>
				<form onSubmit={handleSubmit}>
					<div className="mb-8">
						<h2 className="text-xl font-semibold mb-6">Enquiry Information</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<div>
								<label className="block text-sm font-medium mb-2">Name <span className="text-red-500">*</span></label>
								<input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-4 py-2" />
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Phone</label>
								<input 
									type="tel" 
									name="phone" 
									value={form.phone} 
									onChange={handleChange}
									onBlur={(e) => {
										const formatted = formatAustralianPhone(e.target.value)
										setForm(prev => ({...prev, phone: formatted}))
									}}
									placeholder="0412 345 678"
									className="w-full border rounded px-4 py-2" 
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Email</label>
								<input 
									type="email" 
									name="email" 
									value={form.email} 
									onChange={(e) => {
										const normalized = normalizeEmail(e.target.value)
										setForm(prev => ({...prev, email: normalized}))
									}}
									onBlur={(e) => {
										const suggestion = suggestEmailCorrection(e.target.value)
										if (suggestion && suggestion !== e.target.value) {
											if (confirm(`Did you mean ${suggestion}?`)) {
												setForm(prev => ({...prev, email: suggestion}))
											}
										}
									}}
									placeholder="example@email.com"
									className="w-full border rounded px-4 py-2" 
								/>
							</div>
						</div>
						<div className="mb-6">
							<label className="block text-sm font-medium mb-2">Job Address</label>
							<AddressFields
								streetAddress={form.street_address}
								suburb={form.suburb}
								state={form.state}
								postcode={form.postcode}
								onStreetAddressChange={(value) => setForm(prev => ({ ...prev, street_address: value }))}
								onSuburbChange={(value) => setForm(prev => ({ ...prev, suburb: value }))}
								onStateChange={(value) => setForm(prev => ({ ...prev, state: value }))}
								onPostcodeChange={(value) => setForm(prev => ({ ...prev, postcode: value }))}
								required={false}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">Description</label>
							<textarea name="description" value={form.description} onChange={handleChange} rows={6} className="w-full border rounded px-4 py-2" />
						</div>
					</div>
					<div className="flex gap-4 justify-end">
						<Link href="/enquiries">
							<button type="button" className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
						</Link>
						<button type="submit" className="px-6 py-2 rounded bg-cyan-600 text-white font-semibold">Save</button>
					</div>
				</form>
			</div>
		</div>
	);
}
