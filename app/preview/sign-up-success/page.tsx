'use client'

export default function SuccessPagePreview() {
  const sampleEmail = "john.smith@example.com"
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign-up Success Page Preview</h1>
          <p className="text-gray-600">This is how the success page will look after users sign up:</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white p-4">
            <h2 className="text-lg font-semibold">🌐 Page Preview</h2>
            <p className="text-sm text-gray-300">URL: /auth/sign-up/success?email={sampleEmail}</p>
          </div>
          
          <div className="p-0">
            <iframe 
              src="/auth/sign-up/success?email=john.smith@example.com"
              className="w-full h-[900px] border-0"
              title="Success Page Preview"
            />
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Success Page Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Professional thank you message</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Clear email verification instructions</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Step-by-step guidance (3 steps)</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>"Open Email App" button</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Resend verification option</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Security information (24h expiry)</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Orange theme consistency</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Mobile responsive design</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}