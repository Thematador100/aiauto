import React, { useState } from 'react';

/**
 * Inspector ROI Calculator - Game Theory Pricing Demo
 * Shows inspectors which tier makes them the most money
 */
export const InspectorROICalculator: React.FC = () => {
  const [inspectionsPerMonth, setInspectionsPerMonth] = useState(20);
  const [pricePerInspection, setPricePerInspection] = useState(150);
  const [costPerInspection, setCostPerInspection] = useState(40);

  // Tier configurations
  const tiers = {
    starter: {
      name: 'Starter',
      setupFee: 0,
      monthlyFee: 97,
      revShare: 0,
      inspectionCap: 10,
      leadBoost: 0, // No additional leads from platform
      features: ['Up to 10 inspections/month', 'Basic marketing tools', 'PDF reports', 'Email support'],
    },
    professional: {
      name: 'Professional',
      setupFee: 1497,
      monthlyFee: 197,
      revShare: 0,
      inspectionCap: 50,
      leadBoost: 0,
      features: [
        'Up to 50 inspections/month',
        'White-label branding',
        'Marketing automation',
        'Social media auto-posting',
        'Priority support',
      ],
    },
    enterprise: {
      name: 'Enterprise',
      setupFee: 797,
      monthlyFee: 0,
      revShare: 0.10, // 10%
      inspectionCap: Infinity,
      leadBoost: 0.5, // 50% more leads from our marketplace
      features: [
        'Unlimited inspections',
        'We send you leads',
        'Full marketing engine',
        'GMB automation',
        'Facebook Marketplace leads',
        'Top of inspector directory',
        'Dedicated success manager',
      ],
    },
  };

  // Calculate ROI for each tier
  const calculateTierROI = (tierKey: keyof typeof tiers) => {
    const tier = tiers[tierKey];

    // Cap inspections at tier limit
    const effectiveInspections = Math.min(inspectionsPerMonth, tier.inspectionCap);

    // Add lead boost for Enterprise
    const totalInspections = tierKey === 'enterprise'
      ? effectiveInspections * (1 + tier.leadBoost)
      : effectiveInspections;

    // Monthly calculations
    const monthlyRevenue = totalInspections * pricePerInspection;
    const monthlyCosts = totalInspections * costPerInspection;
    const platformFee = monthlyRevenue * tier.revShare;
    const monthlyProfit = monthlyRevenue - monthlyCosts - platformFee - tier.monthlyFee;

    // Annual calculations
    const annualProfit = monthlyProfit * 12;
    const firstYearProfit = annualProfit - tier.setupFee;
    const roi = tier.setupFee > 0 ? ((firstYearProfit / tier.setupFee) * 100) : Infinity;

    return {
      totalInspections: Math.round(totalInspections),
      monthlyRevenue,
      platformFee,
      monthlyProfit,
      annualProfit,
      firstYearProfit,
      roi,
      cappedOut: inspectionsPerMonth > tier.inspectionCap,
    };
  };

  const starterROI = calculateTierROI('starter');
  const professionalROI = calculateTierROI('professional');
  const enterpriseROI = calculateTierROI('enterprise');

  // Determine best tier
  const getBestTier = () => {
    const results = [
      { name: 'Starter', profit: starterROI.firstYearProfit },
      { name: 'Professional', profit: professionalROI.firstYearProfit },
      { name: 'Enterprise', profit: enterpriseROI.firstYearProfit },
    ];
    return results.sort((a, b) => b.profit - a.profit)[0].name;
  };

  const bestTier = getBestTier();

  return (
    <div className="min-h-screen bg-dark-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-light-text mb-4">
            Inspector ROI Calculator
          </h1>
          <p className="text-medium-text text-lg">
            See which pricing tier makes you the most money
          </p>
        </div>

        {/* Input Controls */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-light-text mb-6">Your Business Metrics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Inspections Per Month */}
            <div>
              <label className="block text-medium-text text-sm mb-2">
                Inspections per month
              </label>
              <input
                type="range"
                min="1"
                max="60"
                value={inspectionsPerMonth}
                onChange={(e) => setInspectionsPerMonth(parseInt(e.target.value))}
                className="w-full mb-2"
              />
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={inspectionsPerMonth}
                  onChange={(e) => setInspectionsPerMonth(parseInt(e.target.value) || 1)}
                  className="w-24 bg-dark-bg border border-dark-border text-light-text rounded px-3 py-2"
                />
                <span className="text-light-text font-bold text-2xl">{inspectionsPerMonth}</span>
              </div>
            </div>

            {/* Price Per Inspection */}
            <div>
              <label className="block text-medium-text text-sm mb-2">
                Price per inspection
              </label>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={pricePerInspection}
                onChange={(e) => setPricePerInspection(parseInt(e.target.value))}
                className="w-full mb-2"
              />
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={pricePerInspection}
                  onChange={(e) => setPricePerInspection(parseInt(e.target.value) || 50)}
                  className="w-24 bg-dark-bg border border-dark-border text-light-text rounded px-3 py-2"
                />
                <span className="text-light-text font-bold text-2xl">${pricePerInspection}</span>
              </div>
            </div>

            {/* Cost Per Inspection */}
            <div>
              <label className="block text-medium-text text-sm mb-2">
                Cost per inspection (gas, time)
              </label>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={costPerInspection}
                onChange={(e) => setCostPerInspection(parseInt(e.target.value))}
                className="w-full mb-2"
              />
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={costPerInspection}
                  onChange={(e) => setCostPerInspection(parseInt(e.target.value) || 20)}
                  className="w-24 bg-dark-bg border border-dark-border text-light-text rounded px-3 py-2"
                />
                <span className="text-light-text font-bold text-2xl">${costPerInspection}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Tier */}
          <div className={`bg-dark-card border-2 rounded-lg p-6 ${
            bestTier === 'Starter' ? 'border-primary' : 'border-dark-border'
          }`}>
            {bestTier === 'Starter' && (
              <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                BEST FOR YOU
              </div>
            )}
            <h3 className="text-2xl font-bold text-light-text mb-2">Starter</h3>
            <div className="text-3xl font-bold text-primary mb-4">
              $97<span className="text-lg text-medium-text">/month</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-sm">
                <div className="text-medium-text">Monthly Inspections</div>
                <div className="text-light-text font-bold text-lg">
                  {starterROI.totalInspections} {starterROI.cappedOut && '⚠️ CAPPED'}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">Monthly Profit</div>
                <div className="text-light-text font-bold text-lg">
                  ${starterROI.monthlyProfit.toLocaleString()}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">Year 1 Profit</div>
                <div className="text-green-400 font-bold text-xl">
                  ${starterROI.firstYearProfit.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="border-t border-dark-border pt-4 mb-4">
              <ul className="space-y-2 text-sm">
                {tiers.starter.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-medium-text">
                    <span className="text-primary mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {starterROI.cappedOut && (
              <div className="bg-yellow-900/30 border border-yellow-500 rounded p-3 text-yellow-300 text-sm">
                ⚠️ You're capped at 10 inspections. Upgrade to earn more!
              </div>
            )}
          </div>

          {/* Professional Tier */}
          <div className={`bg-dark-card border-2 rounded-lg p-6 ${
            bestTier === 'Professional' ? 'border-primary' : 'border-dark-border'
          }`}>
            {bestTier === 'Professional' && (
              <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                BEST FOR YOU
              </div>
            )}
            <h3 className="text-2xl font-bold text-light-text mb-2">Professional</h3>
            <div className="mb-4">
              <div className="text-3xl font-bold text-primary">
                $197<span className="text-lg text-medium-text">/month</span>
              </div>
              <div className="text-sm text-medium-text">+ $1,497 setup fee</div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-sm">
                <div className="text-medium-text">Monthly Inspections</div>
                <div className="text-light-text font-bold text-lg">
                  {professionalROI.totalInspections} {professionalROI.cappedOut && '⚠️ CAPPED'}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">Monthly Profit</div>
                <div className="text-light-text font-bold text-lg">
                  ${professionalROI.monthlyProfit.toLocaleString()}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">Year 1 Profit</div>
                <div className="text-green-400 font-bold text-xl">
                  ${professionalROI.firstYearProfit.toLocaleString()}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">ROI</div>
                <div className="text-primary font-bold">
                  {professionalROI.roi.toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="border-t border-dark-border pt-4 mb-4">
              <ul className="space-y-2 text-sm">
                {tiers.professional.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-medium-text">
                    <span className="text-primary mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {professionalROI.cappedOut && (
              <div className="bg-yellow-900/30 border border-yellow-500 rounded p-3 text-yellow-300 text-sm">
                ⚠️ You're capped at 50 inspections. Consider Enterprise!
              </div>
            )}
          </div>

          {/* Enterprise Tier */}
          <div className={`bg-dark-card border-2 rounded-lg p-6 ${
            bestTier === 'Enterprise' ? 'border-primary' : 'border-dark-border'
          }`}>
            {bestTier === 'Enterprise' && (
              <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                BEST FOR YOU
              </div>
            )}
            <h3 className="text-2xl font-bold text-light-text mb-2">Enterprise</h3>
            <div className="mb-4">
              <div className="text-3xl font-bold text-primary">
                10%<span className="text-lg text-medium-text"> per job</span>
              </div>
              <div className="text-sm text-medium-text">+ $797 setup fee</div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-sm">
                <div className="text-medium-text">Monthly Inspections</div>
                <div className="text-light-text font-bold text-lg">
                  {enterpriseROI.totalInspections}
                  <span className="text-green-400 text-sm ml-2">+50% from our leads!</span>
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">Platform Fee (10%)</div>
                <div className="text-red-400 font-bold text-lg">
                  -${enterpriseROI.platformFee.toLocaleString()}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">Monthly Profit</div>
                <div className="text-light-text font-bold text-lg">
                  ${enterpriseROI.monthlyProfit.toLocaleString()}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">Year 1 Profit</div>
                <div className="text-green-400 font-bold text-xl">
                  ${enterpriseROI.firstYearProfit.toLocaleString()}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-medium-text">ROI</div>
                <div className="text-primary font-bold">
                  {enterpriseROI.roi.toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="border-t border-dark-border pt-4 mb-4">
              <ul className="space-y-2 text-sm">
                {tiers.enterprise.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-medium-text">
                    <span className="text-primary mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-green-900/30 border border-green-500 rounded p-3 text-green-300 text-sm">
              💡 We send you leads worth the 10% fee!
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Best Tier for Your Business: {bestTier}
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Based on {inspectionsPerMonth} inspections/month at ${pricePerInspection} each
            </p>
            <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
