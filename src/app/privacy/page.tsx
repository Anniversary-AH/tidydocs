export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-12" aria-labelledby="privacy-heading">
      <h1 id="privacy-heading" className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-neutral-600">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="mt-8 space-y-8">
        {/* Key Privacy Promise */}
        <div className="rounded-2xl bg-green-50 border border-green-200 p-6">
          <h2 className="text-xl font-semibold text-green-900 mb-3">🔒 Your Files Never Leave Your Browser</h2>
          <p className="text-green-800">
            TidyDocs processes all files entirely in your browser. We never upload, store, or access your documents. 
            Your data remains private and secure on your device at all times.
          </p>
        </div>

        {/* Information We Collect */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Information We Collect</h2>
          
          <h3 className="text-lg font-medium text-neutral-900 mb-3">Files and Documents</h3>
          <p className="text-neutral-700 mb-4">
            <strong>We collect NO files or documents.</strong> All file processing happens locally in your browser. 
            Files are never transmitted to our servers or stored anywhere.
          </p>

          <h3 className="text-lg font-medium text-neutral-900 mb-3">Usage Information</h3>
          <ul className="list-disc list-inside text-neutral-700 space-y-2 mb-4">
            <li>Basic website analytics (page views, session duration) via Vercel Analytics</li>
            <li>Email addresses you voluntarily provide for notifications</li>
            <li>Standard web server logs (IP address, browser type, pages visited)</li>
          </ul>

          <h3 className="text-lg font-medium text-neutral-900 mb-3">Cookies and Tracking</h3>
          <p className="text-neutral-700 mb-4">
            We use minimal cookies for basic website functionality. No tracking cookies or third-party analytics 
            that compromise your privacy.
          </p>
        </div>

        {/* How We Use Information */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">How We Use Your Information</h2>
          <ul className="list-disc list-inside text-neutral-700 space-y-2">
            <li>Provide and improve our document conversion services</li>
            <li>Send notifications about new features (only if you opt-in)</li>
            <li>Analyze website usage to improve user experience</li>
            <li>Respond to customer support inquiries</li>
            <li>Comply with legal obligations</li>
          </ul>
        </div>

        {/* Data Security */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Data Security</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-neutral-900 mb-2">Browser-Only Processing</h3>
              <p className="text-neutral-700">
                All document processing occurs entirely within your browser using client-side JavaScript. 
                Your files never leave your device.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 mb-2">No Server Storage</h3>
              <p className="text-neutral-700">
                We don't store any files, documents, or processed content on our servers. 
                Once you close your browser tab, all processing data is automatically deleted.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 mb-2">Secure Infrastructure</h3>
              <p className="text-neutral-700">
                Our website uses HTTPS encryption and is hosted on secure, reputable platforms 
                (Vercel) with industry-standard security measures.
              </p>
            </div>
          </div>
        </div>

        {/* Third-Party Services */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Third-Party Services</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-neutral-900 mb-2">Vercel Analytics</h3>
              <p className="text-neutral-700 mb-2">
                We use Vercel Analytics for basic website performance metrics. This service:
              </p>
              <ul className="list-disc list-inside text-neutral-700 space-y-1 ml-4">
                <li>Collects anonymous usage statistics</li>
                <li>Does not track individual users</li>
                <li>Respects privacy-focused analytics standards</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 mb-2">Email Notifications</h3>
              <p className="text-neutral-700">
                Email addresses are only collected when you voluntarily provide them for feature notifications. 
                We never share email addresses with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Your Privacy Rights</h2>
          <ul className="list-disc list-inside text-neutral-700 space-y-2">
            <li><strong>Access:</strong> Request information about data we have about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from email notifications at any time</li>
          </ul>
          <p className="text-neutral-700 mt-4">
            To exercise these rights, contact us at <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">our contact page</a>.
          </p>
        </div>

        {/* Children's Privacy */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Children's Privacy</h2>
          <p className="text-neutral-700">
            TidyDocs is not intended for children under 13. We do not knowingly collect personal information 
            from children under 13. If you believe we have collected such information, please contact us immediately.
          </p>
        </div>

        {/* International Users */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">International Users</h2>
          <p className="text-neutral-700">
            TidyDocs is accessible worldwide. By using our service, you consent to the collection and use 
            of information as described in this policy, regardless of your location.
          </p>
        </div>

        {/* Changes to Policy */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Changes to This Privacy Policy</h2>
          <p className="text-neutral-700">
            We may update this privacy policy from time to time. We will notify users of any material changes 
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </div>

        {/* Contact Information */}
        <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Contact Us</h2>
          <p className="text-neutral-700 mb-4">
            If you have any questions about this privacy policy or our data practices, please contact us:
          </p>
          <ul className="text-neutral-700 space-y-2">
            <li>• Email: <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">Contact Form</a></li>
            <li>• Website: <a href="/" className="text-blue-600 hover:text-blue-800 underline">TidyDocs</a></li>
          </ul>
        </div>

        {/* Summary Box */}
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">📋 Privacy Summary</h2>
          <ul className="text-blue-800 space-y-2">
            <li>✅ Your files never leave your browser</li>
            <li>✅ No file storage on our servers</li>
            <li>✅ Minimal data collection</li>
            <li>✅ No tracking or profiling</li>
            <li>✅ You control your data</li>
          </ul>
        </div>
      </div>
    </section>
  );
}


