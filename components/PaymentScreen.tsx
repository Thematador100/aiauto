import React from 'react';
import { CONFIG } from '../config';
import PaymentGateway from './PaymentGateway';
import { PricingPlan } from '../types';

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const PlanCard: React.FC<{ plan: PricingPlan }> = ({ plan }) => (
    <div className="bg-dark-card border border-primary rounded-lg p-6 flex flex-col">
        <h3 className="text-2xl font-bold text-light-text">{plan.name} Plan</h3>
        <p className="mt-2 text-4xl font-extrabold text-light-text">{plan.price}</p>
        <p className="text-medium-text">Billed monthly.</p>

        <ul className="mt-6 space-y-4 flex-grow">
            {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                        <CheckIcon />
                    </div>
                    <p className="ml-3 text-base text-medium-text">{feature}</p>
                </li>
            ))}
        </ul>
        <button className="mt-8 w-full bg-primary hover:bg-primary-light text-white font-bold py-3 px-4 rounded-lg transition-colors">
            Upgrade to Pro
        </button>
    </div>
);


export const PaymentScreen: React.FC = () => {
    const { pro: proPlan } = CONFIG.PRICING.plans;
    const reportPricing = CONFIG.PRICING.reports;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-light-text">Pricing & Plans</h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-medium-text">
                    Choose the plan that's right for your business. From single reports to unlimited access.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Pro Plan */}
                <div className="lg:col-span-1">
                    <PlanCard plan={proPlan} />
                </div>
                
                {/* A La Carte & Payment */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-dark-card border border-dark-border rounded-lg p-6">
                        <h3 className="text-2xl font-bold text-light-text">Pay-Per-Report Pricing</h3>
                        <p className="text-medium-text mt-2">Only need one report? Choose an inspection type below to get started. Prices are a one-time fee.</p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(reportPricing).map(([type, details]) => (
                                <div key={type} className="bg-dark-bg p-3 rounded-md border border-dark-border">
                                    <p className="font-semibold text-light-text">{type}</p>
                                    <p className="text-lg font-bold text-primary">${details.price.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Placeholder for Payment Gateway */}
                    <PaymentGateway />
                </div>
            </div>
        </div>
    );
};