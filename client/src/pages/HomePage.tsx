import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function HomePage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const pricingTiers = [
    {
      name: 'Starter',
      description: 'Perfect for freelancers starting out',
      price: billingPeriod === 'monthly' ? 19 : 190,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      savings: billingPeriod === 'annual' ? 'Save 17%' : '',
      features: [
        'Up to 10 projects',
        'Custom cost database access',
        'Basic cost estimation',
        'Up to 5 clients',
        'PDF report generation',
        'Email support',
      ],
      highlighted: false,
    },
    {
      name: 'Professional',
      description: 'For established quantity surveyors',
      price: billingPeriod === 'monthly' ? 49 : 490,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      savings: billingPeriod === 'annual' ? 'Save 17%' : '',
      features: [
        'Unlimited projects',
        'Full cost database + regional pricing',
        'Advanced cost estimation',
        'Unlimited clients & contractors',
        'Project templates',
        'PDF & Word export',
        'Multi-currency support',
        'Priority support',
        'Cost analysis & benchmarking',
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      description: 'For consulting firms & teams',
      price: 'Custom',
      period: '',
      savings: '',
      features: [
        'Everything in Professional',
        'Team collaboration (unlimited users)',
        'Advanced analytics & reporting',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
        'Custom database modules',
        'On-premise option available',
      ],
      highlighted: false,
    },
  ]

  const testimonials = [
    {
      name: 'Emma Richardson',
      role: 'Freelance Quantity Surveyor',
      image: '👩‍💼',
      quote:
        'QSCostingPro has cut my estimation time in half. The comprehensive cost database and PDF export feature impresses my clients every time.',
      location: 'London, UK',
    },
    {
      name: 'David Chen',
      role: 'Senior Cost Consultant',
      image: '👨‍💼',
      quote:
        'Finally a tool built by QS professionals for QS professionals. The regional pricing data and project templates save me hours on every project.',
      location: 'Manchester, UK',
    },
    {
      name: 'Sarah McCann',
      role: 'Independent QS',
      image: '👩‍💻',
      quote:
        'The contractor management and client portal features make me look like I have a full team behind me. Absolutely transformed my business.',
      location: 'Edinburgh, UK',
    },
    {
      name: 'Michael Patel',
      role: 'Construction Cost Manager',
      image: '👨‍🔧',
      quote:
        'Multi-currency support and the ability to work with international projects has opened up new opportunities for my practice.',
      location: 'Birmingham, UK',
    },
  ]

  const benefits = [
    {
      icon: '📋',
      title: 'NRM 2 Database',
      description:
        'Standard measurement rules to simplify and normalise cost assembly',
    },
    {
      icon: '👥',
      title: 'Client & Contractor Management',
      description:
        'Organize all your clients and contractors in one place. Track contact info, specializations, ratings, and project history.',
    },
    {
      icon: '💼',
      title: 'Professional Estimates',
      description:
        'Create detailed, branded cost estimates in PDF and Word formats. Impress clients with polished reports and detailed breakdowns.',
    },
    {
      icon: '📊',
      title: 'Cost Analysis & Benchmarking',
      description:
        'Analyze historical project data by region, building type, and specification. Make data-driven decisions on future projects.',
    },
    {
      icon: '🌍',
      title: 'Multi-Currency & Regional Support',
      description:
        'Work with clients worldwide. Support for multiple currencies, regions, and localized cost databases.',
    },
    {
      icon: '⚡',
      title: 'Project Templates',
      description:
        'Build reusable templates for common project types. Speed up estimation and ensure consistency across all projects.',
    },
    {
      icon: '🔄',
      title: 'Easy Data Management',
      description:
        'Import/export data easily. Integrate with your existing workflows. APIs available for custom integrations.',
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description:
        'Bank-level encryption, regular backups, and GDPR compliant. Your client data and estimates are always secure and private.',
    },
  ]

  return (
    <div className="bg-blue-200">
      {/* Header Navigation */}
      <nav className="fixed top-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-khc-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">QS</span>
              </div>
              <span className="text-xl font-bold text-khc-primary hidden sm:inline">QSCostingPro</span>
            </Link>
            <div className="space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-khc-primary font-medium hover:text-khc-secondary transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg font-medium transition"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-32 bg-cover bg-center bg-no-repeat relative flex items-center justify-center bg-gray-700" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=1200&h=600&fit=crop')"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Construction Costing Made Easy
            </h1>
            <p className="text-lg text-khc-light mb-8 max-w-3xl mx-auto">
              All-in-one cost-estimate and management platform from just £19/month
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-white text-khc-primary font-bold rounded-lg hover:bg-gray-100 transition text-lg"
              >
                Start Free Trial
              </Link>
              <button className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-khc-primary transition text-lg">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600">
              From cost estimation to client management, QSCostingPro has the tools QS professionals rely on.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 mb-8">Choose the plan that fits your practice</p>

            {/* Billing Toggle */}
            <div className="flex justify-center gap-4 mb-12">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  billingPeriod === 'monthly'
                    ? 'bg-khc-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  billingPeriod === 'annual'
                    ? 'bg-khc-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Annual (Save 17%)
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-lg shadow overflow-hidden transition ${
                  tier.highlighted ? 'ring-2 ring-khc-primary scale-105' : ''
                }`}
              >
                <div className={`p-8 ${tier.highlighted ? 'bg-khc-primary' : 'bg-gray-50'}`}>
                  <h3 className={`text-2xl font-bold mb-2 ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {tier.name}
                  </h3>
                  <p className={`mb-6 ${tier.highlighted ? 'text-khc-light' : 'text-gray-600'}`}>
                    {tier.description}
                  </p>
                  <div className={`mb-6 ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    <span className="text-4xl font-bold">{typeof tier.price === 'number' ? '£' : ''}{tier.price}</span>
                    <span className={`text-lg ${tier.highlighted ? 'text-khc-light' : 'text-gray-600'}`}>
                      {tier.period}
                    </span>
                    {tier.savings && (
                      <p className={`text-sm font-semibold mt-2 ${tier.highlighted ? 'text-khc-light' : 'text-khc-primary'}`}>
                        {tier.savings}
                      </p>
                    )}
                  </div>
                  <Link
                    to="/register"
                    className={`block text-center py-3 rounded-lg font-bold transition mb-8 ${
                      tier.highlighted
                        ? 'bg-white text-khc-primary hover:bg-gray-100'
                        : 'bg-khc-primary text-white hover:bg-khc-secondary'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>

                <div className="p-8">
                  <ul className="space-y-4">
                    {tier.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <span className="text-khc-primary font-bold mt-1">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by QS Professionals</h2>
            <p className="text-xl text-gray-600">See how QSCostingPro has transformed practices worldwide</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-8">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-5xl">{testimonial.image}</span>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-khc-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Work Smarter?</h2>
          <p className="text-xl text-khc-light mb-8">
            Join hundreds of quantity surveyors who are using QSCostingPro to save time and impress clients.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-khc-primary font-bold rounded-lg hover:bg-gray-100 transition text-lg"
            >
              Start Your Free Trial
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-khc-primary transition text-lg"
            >
              Sign In
            </Link>
          </div>
          <p className="text-khc-light text-sm mt-6">No credit card required. 14-day free trial on all plans.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-khc-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">QS</span>
                </div>
                <span className="font-bold text-white">QSCostingPro</span>
              </div>
              <p className="text-sm">Professional cost estimation for quantity surveyors worldwide.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-center">© 2026 QSCostingPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
