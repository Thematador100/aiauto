import React from 'react';
import { hasModule, LicenseModule, LICENSE_PLANS } from '../config/licensePlans';
import { User } from '../types';

interface ModuleGateProps {
  user: User | null;
  module: LicenseModule;
  children: React.ReactNode;
  /** Optional: show an upgrade prompt instead of hiding */
  showUpgrade?: boolean;
  /** Optional: custom upgrade message */
  upgradeMessage?: string;
  /** Optional: recommended plan ID */
  recommendedPlan?: string;
}

/**
 * ModuleGate — wraps any feature and blocks access if the user's license
 * does not include the required module. Shows an upgrade prompt if enabled.
 */
export const ModuleGate: React.FC<ModuleGateProps> = ({
  user,
  module,
  children,
  showUpgrade = true,
  upgradeMessage,
  recommendedPlan,
}) => {
  // Admin always has access to everything
  if (user?.userType === 'admin') return <>{children}</>;

  const userModules: string[] = (user as any)?.modules_enabled || [];
  const allowed = hasModule(userModules, module);

  if (allowed) return <>{children}</>;

  if (!showUpgrade) return null;

  // Find the cheapest plan that includes this module
  const suggestedPlan = recommendedPlan
    ? LICENSE_PLANS.find(p => p.id === recommendedPlan)
    : LICENSE_PLANS.find(p => p.modules.includes(module));

  return (
    <div className="bg-dark-card border border-yellow-500/40 rounded-xl p-8 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <h3 className="text-xl font-bold text-light-text mb-2">Module Not Included</h3>
      <p className="text-medium-text mb-4 max-w-md mx-auto">
        {upgradeMessage || `This feature requires a license upgrade. Your current plan does not include access to this module.`}
      </p>
      {suggestedPlan && (
        <div className="bg-dark-bg border border-yellow-500/30 rounded-lg p-4 mb-4 inline-block text-left">
          <p className="text-sm text-yellow-400 font-semibold mb-1">
            Available in: {suggestedPlan.name} (${suggestedPlan.price.toLocaleString()}/yr)
          </p>
          <p className="text-xs text-medium-text">{suggestedPlan.tagline}</p>
        </div>
      )}
      <div className="flex gap-3 justify-center">
        <a
          href="/upgrade"
          className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-lg transition-colors"
        >
          Upgrade License
        </a>
        <a
          href="mailto:support@aiautopro.com"
          className="px-6 py-2 bg-dark-border hover:bg-dark-border/80 text-light-text font-semibold rounded-lg transition-colors"
        >
          Contact Sales
        </a>
      </div>
    </div>
  );
};

/**
 * useModuleAccess — hook to check module access in functional components
 */
export function useModuleAccess(user: User | null, module: LicenseModule): boolean {
  if (!user) return false;
  if (user.userType === 'admin') return true;
  const userModules: string[] = (user as any)?.modules_enabled || [];
  return hasModule(userModules, module);
}
