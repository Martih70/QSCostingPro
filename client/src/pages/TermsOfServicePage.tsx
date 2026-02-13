import { Link } from 'react-router-dom'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-khc-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">Q</span>
              </div>
              <span className="text-xl font-bold text-khc-primary hidden sm:inline">QSCostingPro</span>
            </Link>
            <div className="space-x-4">
              <Link to="/login" className="px-4 py-2 text-khc-primary font-medium hover:text-khc-secondary transition">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-secondary transition">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: January 2024</p>

          <div className="prose max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing and using the KHConstruct application and website, you accept and agree to be bound by
                and comply with these Terms of Service. If you do not agree to abide by the above, please do not use
                this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) from
                KHConstruct for personal, non-commercial transitory viewing only. This is the grant of a license, not a
                transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile, disassemble, or reverse engineer any software contained on KHConstruct</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
                <li>Using the materials for illegal purposes or in violation of any laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Disclaimer</h2>
              <p>
                The materials on KHConstruct are provided on an 'as is' basis. KHConstruct makes no warranties,
                expressed or implied, and hereby disclaims and negates all other warranties including, without
                limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property or other violation of rights.
              </p>
              <p className="mt-4">
                Further, KHConstruct does not warrant or make any representations concerning the accuracy, likely
                results, or reliability of the use of the materials on its Internet web site or otherwise relating to
                such materials or on any sites linked to this site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limitations</h2>
              <p>
                In no event shall KHConstruct or its suppliers be liable for any damages (including, without limitation,
                damages for loss of data or profit, or due to business interruption,) arising out of the use or
                inability to use the materials on KHConstruct, even if KHConstruct or a KHConstruct authorized
                representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on KHConstruct could include technical, typographical, or photographic errors.
                KHConstruct does not warrant that any of the materials on its website are accurate, complete, or
                current. KHConstruct may make changes to the materials contained on its website at any time without
                notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Materials and Content</h2>
              <p>
                The materials and content on KHConstruct are protected by copyright and may be owned by or licensed to
                KHConstruct by others. You may not distribute, modify, transmit, reuse, download, repost, copy, or
                use said content, whether in whole or in part, for commercial purposes or for personal gain without
                express advance written permission from KHConstruct.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Links</h2>
              <p>
                KHConstruct has not reviewed all of the sites linked to its website and is not responsible for the
                contents of any such linked site. The inclusion of any link does not imply endorsement by KHConstruct
                of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications</h2>
              <p>
                KHConstruct may revise these terms of service for its website at any time without notice. By using this
                website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of the United
                Kingdom, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. User Accounts</h2>
              <p>
                When you create an account on KHConstruct, you are responsible for maintaining the confidentiality of
                your account information and password. You agree to accept responsibility for all activities that occur
                under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
              <p className="mt-4">
                You represent and warrant that the information you provide upon registration and at all other times is
                accurate, complete, and truthful.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Prohibited Activities</h2>
              <p>You agree that you will not engage in any activity that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violates any laws, regulations, or third-party rights</li>
                <li>Infringes intellectual property rights</li>
                <li>Contains viruses, malware, or other harmful code</li>
                <li>Is defamatory, obscene, or offensive</li>
                <li>Harasses or threatens others</li>
                <li>Disrupts the normal flow of dialogue within our services</li>
                <li>Attempts to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Intellectual Property Rights</h2>
              <p>
                Unless otherwise stated, KHConstruct and/or its licensors own the intellectual property rights for all
                material on KHConstruct. All intellectual property rights are reserved. You may access this from
                KHConstruct for your own personal use subject to restrictions set in these terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Payment Terms</h2>
              <p>
                If you subscribe to a paid plan, you agree to pay the subscription fees as advertised. Billing occurs
                monthly or annually depending on your selected plan. You authorize us to charge your payment method for
                the subscription fees and any applicable taxes.
              </p>
              <p className="mt-4">
                You may cancel your subscription at any time. Refunds are subject to our refund policy, which is
                provided separately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Termination of Service</h2>
              <p>
                We reserve the right to suspend or terminate your account and access to our services at any time, for
                any reason, including but not limited to violation of these Terms of Service or for any unlawful
                purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">QSCostingPro Support</p>
                <p>Email: support@qscostingpro.com</p>
                <p>Address: [Your Company Address]</p>
              </div>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-khc-neutral text-khc-light py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 QSCostingPro. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link to="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
