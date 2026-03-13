import React, { useState } from 'react';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  stripeUrl: string;
  highlight?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    name: 'Pro Inspector',
    price: '$997',
    period: '/year',
    description: 'For individual inspectors ready to build a professional inspection business.',
    features: [
      'All 8 vehicle types (car, truck, EV, RV, commercial, classic, motorcycle, fleet)',
      'AI damage & fraud detection — all 6 modules',
      'OBD-II Bluetooth diagnostics',
      'Branded PDF report generator',
      'Guided photo capture (30+ shots)',
      'VIN decode & NHTSA recall lookup',
      'Bilingual (English / Spanish)',
      'Email report delivery',
      'Certification training program',
    ],
    stripeUrl: 'https://buy.stripe.com/bJe3cw2cL3q1ckw1sa33W0H',
  },
  {
    name: 'Commercial & Fleet',
    price: '$1,997',
    period: '/year',
    description: 'For inspectors specializing in 18-wheelers, fleets, and commercial vehicles.',
    features: [
      'Everything in Pro Inspector',
      'J1939 heavy-duty truck diagnostics',
      'FMCSA / DOT compliance checklists',
      'Air brake system testing protocol',
      'Fifth wheel & coupling inspection',
      'DPF / DEF / SCR emissions analysis',
      'Fleet rental before/after comparison',
      'GPS-stamped photo log',
      'Priority support',
    ],
    stripeUrl: 'https://buy.stripe.com/8x27sM18H8Kl84g0o633W0F',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Entrepreneur',
    price: '$3,997',
    period: '/year',
    description: 'Build a team, resell licenses, and own your market.',
    features: [
      'Everything in Commercial & Fleet',
      'Resell inspector licenses (keep the margin)',
      'Sub-inspector management dashboard',
      'Territory exclusivity',
      '20% affiliate commission on referrals',
      'White-label branding option',
      'Dedicated account manager',
      'Early access to new features',
    ],
    stripeUrl: 'https://buy.stripe.com/5kQ00kg3B3q13O07Qy33W0G',
  },
];

const PaymentGateway: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = (plan: Plan) => {
    setLoading(plan.name);
    setTimeout(() => {
      window.open(plan.stripeUrl, '_blank', 'noopener,noreferrer');
      setLoading(null);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Choose Your License</h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            One-time annual fee. No monthly charges. No per-report fees. Keep 100% of every dollar you earn.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 flex flex-col shadow-sm ${
                plan.highlight
                  ? 'border-blue-500 bg-white shadow-lg shadow-blue-100'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0 font-bold">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.name}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-gray-900 hover:bg-gray-700 text-white'
                } disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {loading === plan.name ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Redirecting to Checkout...
                  </>
                ) : (
                  `Get ${plan.name} →`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <span>🔒 Secured by Stripe</span>
          <span>✅ Instant access after payment</span>
          <span>📋 No contracts — cancel anytime</span>
          <span>💬 Support included</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
