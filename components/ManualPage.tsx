import React, { useEffect } from 'react';

interface ManualPageProps {
  onBack?: () => void;
}

export const ManualPage: React.FC<ManualPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11pt !important; }
          .no-print { display: none !important; }
          .manual-container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .manual-container * { color: black !important; background: white !important; border-color: #ccc !important; }
          .manual-page-break { page-break-before: always; }
          .manual-section { break-inside: avoid; }
          .manual-table { border-collapse: collapse; width: 100%; }
          .manual-table th, .manual-table td { border: 1px solid #333 !important; padding: 6px 10px; text-align: left; }
          .manual-table th { background: #e5e5e5 !important; font-weight: bold; }
          .manual-header-bar { background: #1a1a2e !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .manual-header-bar * { color: white !important; }
          .grade-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .tip-box { border: 2px solid #333 !important; padding: 12px !important; }
          h1 { font-size: 22pt !important; }
          h2 { font-size: 16pt !important; page-break-after: avoid; }
          h3 { font-size: 13pt !important; page-break-after: avoid; }
          a { text-decoration: none !important; }
        }
      `}</style>

      {/* Action bar - hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-dark-card border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-medium-text hover:text-light-text transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-bold text-light-text">Inspector Manual</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print / Save as PDF
        </button>
      </div>

      {/* Manual content */}
      <div className="manual-container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-light-text">

        {/* COVER PAGE */}
        <div className="text-center mb-16 pt-8">
          <div className="manual-header-bar bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl p-12 mb-8">
            <div className="text-6xl mb-4">&#128663;</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">AI Auto Pro</h1>
            <p className="text-xl text-blue-300 font-medium">Inspector Training Manual</p>
            <div className="mt-6 flex justify-center gap-4 text-sm">
              <span className="bg-white/10 px-3 py-1 rounded-full">Version 1.0</span>
              <span className="bg-white/10 px-3 py-1 rounded-full">February 2026</span>
            </div>
          </div>
          <p className="text-medium-text text-lg max-w-2xl mx-auto">
            The complete guide to performing professional vehicle inspections using the AI Auto Pro platform.
            This manual covers every feature of the tool from setup to delivering your final report.
          </p>
        </div>

        {/* TABLE OF CONTENTS */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Table of Contents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              ['1', 'Getting Started'],
              ['2', 'Installing the App on Your Phone'],
              ['3', 'Logging In'],
              ['4', 'Your Dashboard'],
              ['5', 'Starting a New Inspection'],
              ['6', 'The Inspection Checklist'],
              ['7', 'Taking Photos'],
              ['8', 'Recording Voice Notes'],
              ['9', 'Fraud & Damage Detection (AI)'],
              ['10', 'Using the Diagnostics Scanner'],
              ['11', 'Finalizing Your Report'],
              ['12', 'Understanding the Vehicle Grade'],
              ['13', 'Delivering the Report'],
              ['14', 'Using the AI Assistant'],
              ['15', 'Vehicle-Specific Guides'],
              ['16', 'Managing Your Account'],
              ['17', 'Admin: Managing Inspectors'],
              ['18', 'Troubleshooting'],
              ['19', 'Quick Reference Card'],
            ].map(([num, title]) => (
              <div key={num} className="flex items-center gap-2 py-1">
                <span className="text-primary font-bold w-6 text-right">{num}.</span>
                <span className="text-light-text">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: GETTING STARTED */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">1. Getting Started</h2>

          <h3 className="text-xl font-semibold mb-3 text-primary">What You Need</h3>
          <ul className="list-disc list-inside space-y-2 mb-6 text-medium-text">
            <li>A smartphone or tablet (iPhone, Android, or iPad)</li>
            <li>Internet connection (Wi-Fi or cellular data)</li>
            <li>Your login credentials (email and password from your administrator)</li>
            <li>An OBD-II Bluetooth scanner for diagnostics (recommended: OBDLink MX+) &mdash; optional</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 text-primary">What This Tool Does</h3>
          <p className="text-medium-text mb-4">
            AI Auto Pro is a professional vehicle inspection platform that guides you step-by-step through a complete vehicle inspection. It supports:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {[
              ['6 Vehicle Types', 'Standard, EV, Commercial, RV, Classic, Motorcycle'],
              ['AI Analysis', 'Fraud detection, damage scanning, auto-generated summaries'],
              ['Photo Evidence', 'Attach photos to any item. AI scans exteriors for hidden damage'],
              ['Voice Notes', 'Record hands-free audio observations'],
              ['OBD Diagnostics', 'Read fault codes and live data from vehicle computer'],
              ['Pro Reports', 'Vehicle grade (A-F), buy/walk recommendation, repair cost estimates'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-dark-card border border-dark-border rounded-lg p-4">
                <p className="font-semibold text-light-text text-sm">{title}</p>
                <p className="text-xs text-medium-text mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: INSTALLING THE APP */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">2. Installing the App on Your Phone</h2>
          <p className="text-medium-text mb-4">
            AI Auto Pro is a web app &mdash; there is <strong className="text-light-text">nothing to download</strong> from the App Store or Google Play. You access it through your web browser, and it works just like a regular app.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">iPhone / iPad</h3>
              <ol className="list-decimal list-inside space-y-2 text-medium-text text-sm">
                <li>Open <strong className="text-light-text">Safari</strong></li>
                <li>Go to your company&apos;s app URL</li>
                <li>Tap the <strong className="text-light-text">Share</strong> button (square with arrow)</li>
                <li>Scroll down, tap <strong className="text-light-text">&quot;Add to Home Screen&quot;</strong></li>
                <li>Tap <strong className="text-light-text">&quot;Add&quot;</strong></li>
              </ol>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-green-400">Android</h3>
              <ol className="list-decimal list-inside space-y-2 text-medium-text text-sm">
                <li>Open <strong className="text-light-text">Chrome</strong></li>
                <li>Go to your company&apos;s app URL</li>
                <li>Tap <strong className="text-light-text">&quot;Install&quot;</strong> if banner appears</li>
                <li>Or tap the <strong className="text-light-text">three dots</strong> menu</li>
                <li>Tap <strong className="text-light-text">&quot;Add to Home Screen&quot;</strong></li>
              </ol>
            </div>
          </div>

          <div className="tip-box bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300"><strong>Good to know:</strong> Updates happen automatically. When your administrator pushes an update, you get it the next time you open the app. No action needed from you.</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: LOGGING IN */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">3. Logging In</h2>
          <ol className="list-decimal list-inside space-y-2 mb-6 text-medium-text">
            <li>Open the app from your home screen</li>
            <li>Enter the <strong className="text-light-text">email address</strong> your administrator gave you</li>
            <li>Enter your <strong className="text-light-text">password</strong></li>
            <li>Tap <strong className="text-light-text">&quot;Sign In&quot;</strong></li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 text-primary">Forgot Your Password?</h3>
          <ol className="list-decimal list-inside space-y-2 text-medium-text">
            <li>Tap <strong className="text-light-text">&quot;Forgot password?&quot;</strong> on the login screen</li>
            <li>Enter your email address</li>
            <li>Tap <strong className="text-light-text">&quot;Send Reset Code&quot;</strong></li>
            <li>Check your email for a 6-digit code</li>
            <li>Enter the code and create a new password (minimum 8 characters)</li>
            <li>Sign in with your new password</li>
          </ol>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: YOUR DASHBOARD */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">4. Your Dashboard</h2>
          <p className="text-medium-text mb-4">
            After logging in, you land on your Dashboard. This is your home base.
          </p>

          <h3 className="text-xl font-semibold mb-3 text-primary">What You See</h3>
          <ul className="list-disc list-inside space-y-2 mb-6 text-medium-text">
            <li><strong className="text-light-text">&quot;+ New Inspection&quot;</strong> button &mdash; starts a new inspection</li>
            <li><strong className="text-light-text">Recent Reports</strong> table &mdash; all your past inspections with date, vehicle, VIN, and report ID</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 text-primary">Navigation Tabs</h3>
          <div className="overflow-x-auto">
            <table className="manual-table w-full text-sm border border-dark-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-dark-card">
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Tab</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">What It Does</th>
                </tr>
              </thead>
              <tbody className="text-medium-text">
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Dashboard</td><td className="px-4 py-2">Home screen with past reports</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Inspection</td><td className="px-4 py-2">Start or continue an inspection</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Diagnostics</td><td className="px-4 py-2">OBD scanner and vehicle diagnostics</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Assistant</td><td className="px-4 py-2">AI chatbot for automotive questions</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-light-text">Profile</td><td className="px-4 py-2">Account settings, change password, sign out</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-medium-text mt-2">On a phone, tap the menu icon (three lines) in the top right to see these tabs.</p>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: STARTING A NEW INSPECTION */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">5. Starting a New Inspection</h2>

          <div className="space-y-6">
            <div className="manual-section">
              <h3 className="text-xl font-semibold mb-3 text-primary">Step 1: Tap &quot;+ New Inspection&quot;</h3>
              <p className="text-medium-text">From your Dashboard, tap the &quot;+ New Inspection&quot; button.</p>
            </div>

            <div className="manual-section">
              <h3 className="text-xl font-semibold mb-3 text-primary">Step 2: Enter the VIN</h3>
              <p className="text-medium-text mb-3">Type or paste the <strong className="text-light-text">17-character VIN</strong> (Vehicle Identification Number) into the field. The VIN is usually found on:</p>
              <ul className="list-disc list-inside space-y-1 mb-4 text-medium-text ml-4">
                <li>The driver&apos;s side dashboard (visible through the windshield)</li>
                <li>The driver&apos;s door jamb sticker</li>
                <li>The vehicle registration or title</li>
              </ul>
              <p className="text-medium-text">Tap <strong className="text-light-text">&quot;Decode VIN&quot;</strong> and the system automatically looks up the year, make, and model.</p>
            </div>

            <div className="manual-section">
              <h3 className="text-xl font-semibold mb-3 text-primary">Step 3: Select Vehicle Type</h3>
              <p className="text-medium-text mb-3">Choose the type that matches the vehicle:</p>
              <div className="overflow-x-auto">
                <table className="manual-table w-full text-sm border border-dark-border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-dark-card">
                      <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Use For</th>
                    </tr>
                  </thead>
                  <tbody className="text-medium-text">
                    <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Standard</td><td className="px-4 py-2">Cars, SUVs, crossovers, minivans, pickup trucks</td></tr>
                    <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Electric Vehicle</td><td className="px-4 py-2">Tesla, Rivian, any battery-electric vehicle</td></tr>
                    <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Commercial</td><td className="px-4 py-2">Class 6-8 trucks, semi-trucks, box trucks, buses</td></tr>
                    <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">RV / Motorhome</td><td className="px-4 py-2">Class A, B, C motorhomes, travel trailers, fifth wheels</td></tr>
                    <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Classic / Vintage</td><td className="px-4 py-2">Collector cars, generally pre-1990 or special interest</td></tr>
                    <tr><td className="px-4 py-2 font-semibold text-light-text">Motorcycle</td><td className="px-4 py-2">All two-wheeled motor vehicles</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="tip-box bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-300"><strong>Why does this matter?</strong> Each type loads a different checklist designed for that specific vehicle. A commercial truck has DOT compliance items. An RV has propane safety items. A classic car has authenticity checks. Selecting the right type ensures you don&apos;t miss anything critical.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: THE INSPECTION CHECKLIST */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">6. The Inspection Checklist</h2>

          <h3 className="text-xl font-semibold mb-3 text-primary">The Progress Bar</h3>
          <p className="text-medium-text mb-4">
            At the top of the inspection screen is a sticky progress bar that stays visible as you scroll. It shows how many items you&apos;ve completed, how many photos you&apos;ve taken, and counts of fails and concerns. The bar changes color as you work:
          </p>
          <div className="flex gap-3 mb-6">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-600 text-white">Yellow = Under 50%</span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600 text-white">Blue = 50-99%</span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-600 text-white">Green = 100%</span>
          </div>

          <h3 className="text-xl font-semibold mb-3 text-primary">Entering the Odometer</h3>
          <p className="text-medium-text mb-6">The first thing to do is enter the odometer reading. Type the exact number shown on the vehicle (numbers only). For commercial vehicles, this may be a hubodometer reading.</p>

          <h3 className="text-xl font-semibold mb-3 text-primary">Working Through Each Item</h3>
          <p className="text-medium-text mb-3">Every checklist item has:</p>
          <ol className="list-decimal list-inside space-y-2 mb-6 text-medium-text">
            <li><strong className="text-light-text">Checkbox</strong> &mdash; tap to mark the item as inspected</li>
            <li><strong className="text-light-text">Condition buttons</strong> &mdash; tap one: Pass, Fail, Concern, or N/A</li>
            <li><strong className="text-light-text">Notes field</strong> &mdash; type any observations</li>
            <li><strong className="text-light-text">Add Photo</strong> &mdash; attach a photo of this item</li>
            <li><strong className="text-light-text">Record Audio</strong> &mdash; record a voice note hands-free</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 text-primary">What Each Rating Means</h3>
          <div className="overflow-x-auto">
            <table className="manual-table w-full text-sm border border-dark-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-dark-card">
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Rating</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">When to Use</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Example</th>
                </tr>
              </thead>
              <tbody className="text-medium-text">
                <tr className="border-b border-dark-border">
                  <td className="px-4 py-2"><span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">Pass</span></td>
                  <td className="px-4 py-2">Item is in acceptable condition</td>
                  <td className="px-4 py-2">Brake pads have 6mm remaining</td>
                </tr>
                <tr className="border-b border-dark-border">
                  <td className="px-4 py-2"><span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Fail</span></td>
                  <td className="px-4 py-2">Needs immediate repair</td>
                  <td className="px-4 py-2">Tire has exposed steel cords</td>
                </tr>
                <tr className="border-b border-dark-border">
                  <td className="px-4 py-2"><span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded">Concern</span></td>
                  <td className="px-4 py-2">Marginal, approaching failure</td>
                  <td className="px-4 py-2">Brake pads at 3mm, needs replacing soon</td>
                </tr>
                <tr>
                  <td className="px-4 py-2"><span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">N/A</span></td>
                  <td className="px-4 py-2">Does not apply</td>
                  <td className="px-4 py-2">Fifth Wheel on a straight truck</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="tip-box bg-green-900/20 border border-green-500/30 rounded-lg p-4 mt-6">
            <p className="text-sm text-green-300"><strong>Best Practice:</strong> Every item marked Fail or Concern should have a photo attached and a note explaining what you found. This is your evidence and protects both you and your customer.</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7: TAKING PHOTOS */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">7. Taking Photos</h2>
          <p className="text-medium-text mb-4">Photos are critical evidence for your inspection report. They protect you, your customer, and build trust.</p>

          <h3 className="text-xl font-semibold mb-3 text-primary">How to Take a Photo</h3>
          <ol className="list-decimal list-inside space-y-2 mb-6 text-medium-text">
            <li>Scroll to the checklist item you want to photograph</li>
            <li>Tap <strong className="text-light-text">&quot;Add Photo&quot;</strong></li>
            <li>Your phone&apos;s camera opens (or you can choose an existing photo)</li>
            <li>Take the photo &mdash; it appears as a thumbnail under that item</li>
            <li>You can add multiple photos to the same item</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 text-primary">Photo Tips</h3>
          <ul className="list-disc list-inside space-y-2 text-medium-text">
            <li><strong className="text-light-text">Fails and concerns should always have a photo</strong> &mdash; this is your evidence</li>
            <li>For body damage, get <strong className="text-light-text">close-up and wide-angle</strong> shots</li>
            <li>Make sure there is good lighting</li>
            <li>For undercarriage items, use your phone&apos;s flashlight</li>
            <li>Photos are automatically compressed to save data</li>
            <li>During finalization, exterior photos are sent to AI for automatic damage analysis</li>
          </ul>
        </section>

        {/* ============================================================ */}
        {/* SECTION 8: VOICE NOTES */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">8. Recording Voice Notes</h2>
          <p className="text-medium-text mb-4">When your hands are busy or dirty, use voice notes instead of typing.</p>
          <ol className="list-decimal list-inside space-y-2 mb-6 text-medium-text">
            <li>Tap the <strong className="text-light-text">&quot;Record Audio&quot;</strong> button (microphone icon) on any checklist item</li>
            <li>Allow microphone access if prompted</li>
            <li>Speak clearly about what you observe</li>
            <li>Tap <strong className="text-light-text">&quot;Stop&quot;</strong> when done</li>
            <li>A green checkmark appears &mdash; <strong className="text-light-text">&quot;Audio Saved&quot;</strong></li>
          </ol>
          <div className="tip-box bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300"><strong>Example:</strong> &quot;Left front brake pad is at approximately 2 millimeters. Recommend immediate replacement. There is also scoring on the rotor.&quot;</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 9: FRAUD & DAMAGE DETECTION */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">9. Fraud & Damage Detection (AI)</h2>
          <p className="text-medium-text mb-4">
            Before finalizing your report, you have access to three powerful AI analysis tools. These are optional but highly recommended for thorough inspections.
          </p>
          <p className="text-medium-text mb-6">
            <strong className="text-light-text">How to access:</strong> Scroll down past the checklist and tap the <strong className="text-light-text">&quot;Advanced Fraud & Damage Detection&quot;</strong> section (purple &quot;AI&quot; badge) to expand it.
          </p>

          {/* Odometer */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-3 text-red-400">Tab 1: Odometer Fraud</h3>
            <p className="text-medium-text mb-3">Detects if the odometer has been rolled back by analyzing wear patterns.</p>
            <p className="text-sm font-semibold text-light-text mb-2">What to photograph:</p>
            <ul className="list-disc list-inside space-y-1 mb-4 text-medium-text text-sm">
              <li><strong className="text-light-text">Pedal wear</strong> (required) &mdash; brake and gas pedals from above</li>
              <li><strong className="text-light-text">Steering wheel</strong> (optional) &mdash; showing wear on the grip</li>
              <li><strong className="text-light-text">Driver&apos;s seat</strong> (optional) &mdash; bolster area where driver enters/exits</li>
            </ul>
            <p className="text-sm text-medium-text">The AI compares wear patterns to claimed mileage and returns a risk level: <span className="text-green-400">LOW</span>, <span className="text-yellow-400">MODERATE</span>, or <span className="text-red-400">HIGH</span> with a fraud probability percentage.</p>
          </div>

          {/* Flood */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-3 text-yellow-400">Tab 2: Flood Damage</h3>
            <p className="text-medium-text mb-3">Identifies vehicles that have been through flooding.</p>
            <p className="text-sm font-semibold text-light-text mb-2">Check any indicators you observe:</p>
            <ul className="list-disc list-inside space-y-1 mb-4 text-medium-text text-sm">
              <li>Musty/mold smell in cabin</li>
              <li>Water stains visible</li>
              <li>Rust in unusual places</li>
              <li>Foggy headlights/taillights</li>
              <li>Carpet recently replaced</li>
              <li>Electrical corrosion present</li>
            </ul>
            <p className="text-sm text-medium-text">Upload carpet/interior and engine bay photos. The AI evaluates all evidence together.</p>
          </div>

          {/* Body Damage */}
          <div className="bg-dark-card border border-purple-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-3 text-purple-400">Tab 3: Body Damage AI Scan</h3>
            <p className="text-medium-text mb-3">
              Our most advanced feature &mdash; similar to rental car company damage scanning technology.
              The AI analyzes exterior photos to detect dents, paint mismatches, panel gap issues, hidden repairs, and accident evidence.
            </p>
            <p className="text-sm font-semibold text-light-text mb-2">Upload up to 8 photos:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs text-medium-text">
              <span className="bg-dark-bg rounded p-2 text-center">Front straight-on</span>
              <span className="bg-dark-bg rounded p-2 text-center">Rear straight-on</span>
              <span className="bg-dark-bg rounded p-2 text-center">Driver side profile</span>
              <span className="bg-dark-bg rounded p-2 text-center">Passenger side profile</span>
              <span className="bg-dark-bg rounded p-2 text-center">Front left corner</span>
              <span className="bg-dark-bg rounded p-2 text-center">Front right corner</span>
              <span className="bg-dark-bg rounded p-2 text-center">Rear left corner</span>
              <span className="bg-dark-bg rounded p-2 text-center">Rear right corner</span>
            </div>
            <p className="text-sm text-medium-text">Results include: overall severity, accident likelihood, repaint detection, panel gap analysis, and a detailed list of findings by body area.</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 10: DIAGNOSTICS */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">10. Using the Diagnostics Scanner</h2>
          <p className="text-medium-text mb-4">The Diagnostics tab lets you connect to the vehicle&apos;s onboard computer to read fault codes and live sensor data.</p>

          <h3 className="text-xl font-semibold mb-3 text-primary">Scanner Modes</h3>
          <div className="overflow-x-auto mb-6">
            <table className="manual-table w-full text-sm border border-dark-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-dark-card">
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Mode</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Vehicles</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Connector</th>
                </tr>
              </thead>
              <tbody className="text-medium-text">
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Pro Bluetooth</td><td className="px-4 py-2">Cars, SUVs, EVs, gas motorhomes</td><td className="px-4 py-2">16-pin OBD-II under dashboard</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Heavy-Duty J1939</td><td className="px-4 py-2">Class 6-8 trucks, diesel pushers</td><td className="px-4 py-2">9-pin round Deutsch connector</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">WiFi Scanner</td><td className="px-4 py-2">Same as Bluetooth (for iPhone)</td><td className="px-4 py-2">WiFi OBD-II adapter</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-light-text">Manual Entry</td><td className="px-4 py-2">Classic cars, no scanner available</td><td className="px-4 py-2">None &mdash; type codes manually</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold mb-3 text-primary">RV Connector Guide</h3>
          <div className="overflow-x-auto mb-6">
            <table className="manual-table w-full text-sm border border-dark-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-dark-card">
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">RV Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Connector</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Scanner Mode</th>
                </tr>
              </thead>
              <tbody className="text-medium-text">
                <tr className="border-b border-dark-border"><td className="px-4 py-2">Gas Motorhome (Class A/C)</td><td className="px-4 py-2">16-pin OBD-II under dashboard</td><td className="px-4 py-2">Pro Bluetooth</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2">Diesel Pusher</td><td className="px-4 py-2">9-pin Deutsch (J1939)</td><td className="px-4 py-2">Heavy-Duty J1939</td></tr>
                <tr><td className="px-4 py-2">Travel Trailer / Fifth Wheel</td><td className="px-4 py-2">No engine connector</td><td className="px-4 py-2">Not applicable</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold mb-3 text-primary">Connecting a Bluetooth Scanner</h3>
          <ol className="list-decimal list-inside space-y-2 text-medium-text">
            <li>Plug the OBD-II adapter into the vehicle&apos;s port (usually under the dashboard, driver side)</li>
            <li>Turn the vehicle&apos;s ignition to ON</li>
            <li>Select &quot;Pro Bluetooth&quot; in the app</li>
            <li>The app connects automatically</li>
            <li>Read fault codes, view live sensor data, and check battery health (EVs)</li>
          </ol>
        </section>

        {/* ============================================================ */}
        {/* SECTION 11: FINALIZING */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">11. Finalizing Your Report</h2>
          <p className="text-medium-text mb-4">When you have completed the checklist, added photos and notes, and optionally run fraud detection and diagnostics:</p>
          <ol className="list-decimal list-inside space-y-2 mb-6 text-medium-text">
            <li>Review your progress bar &mdash; ideally it should be at <strong className="text-light-text">100%</strong></li>
            <li>Make sure the odometer reading is entered correctly</li>
            <li>Tap <strong className="text-light-text">&quot;Finalize & Generate Report&quot;</strong></li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 text-primary">What Happens Automatically</h3>
          <p className="text-medium-text mb-3">The app runs several processes simultaneously (15-30 seconds):</p>
          <ul className="list-disc list-inside space-y-2 text-medium-text">
            <li><strong className="text-light-text">Vehicle history</strong> &mdash; checks for accidents, title issues, prior owners</li>
            <li><strong className="text-light-text">Safety recalls</strong> &mdash; queries the NHTSA recall database</li>
            <li><strong className="text-light-text">Theft & salvage</strong> &mdash; verifies the vehicle is not stolen or salvage-titled</li>
            <li><strong className="text-light-text">AI summary</strong> &mdash; writes a professional summary of your findings</li>
            <li><strong className="text-light-text">Damage scan</strong> &mdash; if exterior photos exist, AI analyzes them for hidden damage</li>
            <li><strong className="text-light-text">Vehicle grade</strong> &mdash; computes A-F grade from your inspection results</li>
          </ul>
          <div className="tip-box bg-red-900/20 border border-red-500/30 rounded-lg p-4 mt-4">
            <p className="text-sm text-red-300"><strong>Important:</strong> Do not close the app during report generation.</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 12: VEHICLE GRADE */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">12. Understanding the Vehicle Grade</h2>
          <p className="text-medium-text mb-6">Every report includes a Vehicle Grade from A to F. This is computed automatically from your inspection results.</p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8">
            {[
              { letter: 'A', range: '90-100', rec: 'Strong Buy', color: 'bg-green-600', desc: 'Excellent condition' },
              { letter: 'B', range: '80-89', rec: 'Buy with Confidence', color: 'bg-blue-600', desc: 'Good with minor issues' },
              { letter: 'C', range: '65-79', rec: 'Buy with Caution', color: 'bg-yellow-600', desc: 'Negotiate for repairs' },
              { letter: 'D', range: '50-64', rec: 'Negotiate or Walk', color: 'bg-orange-600', desc: 'Significant problems' },
              { letter: 'F', range: '0-49', rec: 'Walk Away', color: 'bg-red-600', desc: 'Too many issues' },
            ].map((g) => (
              <div key={g.letter} className="grade-badge bg-dark-card border border-dark-border rounded-lg p-4 text-center">
                <div className={`${g.color} text-white text-3xl font-extrabold w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2`}>{g.letter}</div>
                <p className="text-xs font-bold text-light-text">{g.range}</p>
                <p className="text-xs text-primary font-semibold mt-1">{g.rec}</p>
                <p className="text-xs text-medium-text mt-1">{g.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold mb-3 text-primary">What Affects the Grade</h3>
          <div className="overflow-x-auto">
            <table className="manual-table w-full text-sm border border-dark-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-dark-card">
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Factor</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Impact</th>
                </tr>
              </thead>
              <tbody className="text-medium-text">
                <tr className="border-b border-dark-border"><td className="px-4 py-2">High pass rate</td><td className="px-4 py-2 text-green-400">Higher score</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2">Each failed item</td><td className="px-4 py-2 text-red-400">-2 points</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2">Each concern item</td><td className="px-4 py-2 text-yellow-400">-0.5 points</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2">Accident on record</td><td className="px-4 py-2 text-red-400">-10 points</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2">Salvage title</td><td className="px-4 py-2 text-red-400">-20 points</td></tr>
                <tr><td className="px-4 py-2">Open safety recalls</td><td className="px-4 py-2 text-yellow-400">-3 points each (max -15)</td></tr>
              </tbody>
            </table>
          </div>

          <p className="text-medium-text mt-4">The report also shows <strong className="text-light-text">estimated repair costs</strong>: $350 per failed item + $120 per concern item.</p>
        </section>

        {/* ============================================================ */}
        {/* SECTION 13: DELIVERING THE REPORT */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">13. Delivering the Report</h2>
          <p className="text-medium-text mb-4">After the report is generated, you have three ways to deliver it to your customer:</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
              <div className="text-2xl mb-2">&#9993;</div>
              <h3 className="font-semibold text-light-text mb-2">Email</h3>
              <p className="text-xs text-medium-text">Tap &quot;Email Report&quot;, enter the recipient&apos;s name and email, optionally add a message, and tap Send.</p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
              <div className="text-2xl mb-2">&#128196;</div>
              <h3 className="font-semibold text-light-text mb-2">PDF Download</h3>
              <p className="text-xs text-medium-text">Tap &quot;Download PDF&quot; and share via text message, AirDrop, email, or any other method.</p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
              <div className="text-2xl mb-2">&#128424;</div>
              <h3 className="font-semibold text-light-text mb-2">Print</h3>
              <p className="text-xs text-medium-text">Tap &quot;Print&quot; to send to your portable Bluetooth printer or any available printer.</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3 text-primary">What the Customer Receives</h3>
          <ul className="list-disc list-inside space-y-2 text-medium-text">
            <li>Vehicle info (year, make, model, VIN, odometer)</li>
            <li>Inspector name and company</li>
            <li>Vehicle Grade (A-F) with score, buy recommendation, and estimated repair costs</li>
            <li>AI-written summary with key findings and recommendations</li>
            <li>AI damage assessment (if exterior photos analyzed)</li>
            <li>Detailed findings for every checklist item with photos and notes</li>
            <li>Vehicle history, theft/salvage check, and open safety recalls</li>
            <li>Professional disclaimer</li>
          </ul>
        </section>

        {/* ============================================================ */}
        {/* SECTION 14: AI ASSISTANT */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">14. Using the AI Assistant</h2>
          <p className="text-medium-text mb-4">The AI Assistant is your on-the-job helper. Tap the <strong className="text-light-text">&quot;Assistant&quot;</strong> tab to access it.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
              <h3 className="font-semibold text-light-text mb-2">Type a Question</h3>
              <p className="text-sm text-medium-text">Type in the text box at the bottom and tap &quot;Send&quot;.</p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
              <h3 className="font-semibold text-light-text mb-2">Use Voice</h3>
              <p className="text-sm text-medium-text">Tap the microphone button, speak your question, and it sends automatically. Tap &quot;Listen&quot; on any reply to hear it read aloud.</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3 text-primary">Example Questions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-medium-text">
            {[
              'What does code P0420 mean?',
              'What is the minimum tread depth for steer tires?',
              'What should I look for on an RV roof?',
              'How do I test an air brake system?',
              'What does SPN 3226 FMI 2 mean?',
              'What are signs of a flood-damaged vehicle?',
              'Is it normal for a diesel to knock at idle?',
              'What are DOT reflective tape requirements?',
            ].map((q) => (
              <div key={q} className="bg-dark-bg rounded p-2">&quot;{q}&quot;</div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 15: VEHICLE-SPECIFIC GUIDES */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">15. Vehicle-Specific Guides</h2>

          {[
            {
              type: 'Standard Cars & SUVs',
              color: 'border-blue-500/30',
              sections: 'Exterior & Body, Tires & Brakes, Engine Compartment, Interior, Test Drive',
              tips: [
                'Check body panel alignment and paint consistency between panels',
                'Measure tire tread depth on all four tires plus spare',
                'Check engine oil color and level (dark/gritty = overdue)',
                'Note all dashboard warning lights with engine running',
                'Test transmission shift quality during test drive',
              ],
            },
            {
              type: 'Electric Vehicles',
              color: 'border-green-500/30',
              sections: 'Exterior & Body, Tires & Brakes, Battery & Charging, Interior & Electronics, Test Drive',
              tips: [
                'Battery State of Health (SoH) is the most critical metric — use Bluetooth diagnostics',
                'Inspect charge port and cable for damage or burn marks',
                'Test regenerative braking function during test drive',
                'EV brake pads last longer due to regen — tire wear is more common',
                'Check all ADAS (driver assist) systems for calibration',
              ],
            },
            {
              type: 'Commercial / 18-Wheeler',
              color: 'border-orange-500/30',
              sections: 'Cab Exterior, Chassis & Drivetrain, Tires/Wheels/Brakes, Cab Interior, Special Equipment + DOT/FMCSA Compliance',
              tips: [
                'Tire tread: 4/32" minimum for steer tires, 2/32" for all others',
                'Air loss rate: <2 PSI/min single vehicle, <3 PSI/min combination',
                'Check slack adjuster stroke length is within CMV limits',
                'Frame rails — check for cracks, bends, and weld repairs',
                'Use Heavy-Duty J1939 scanner mode with 9-pin Deutsch adapter',
              ],
            },
            {
              type: 'RV / Motorhome / Travel Trailer',
              color: 'border-purple-500/30',
              sections: 'Coach Exterior, Chassis/Frame, Life Support Systems, Interior Appliances, Cabin + Habitability & Safety',
              tips: [
                'ROOF is the #1 priority — most expensive RV repair. Check seams and seals',
                'Press sidewalls to check for delamination (sponginess = water damage)',
                'Check for water intrusion under every window and overhead cabinet',
                'Test every slide-out: extend, retract, inspect seals',
                'Use soapy water at every propane connection to check for leaks',
              ],
            },
            {
              type: 'Classic / Vintage / Collector',
              color: 'border-yellow-500/30',
              sections: 'Body & Paint, Frame & Undercarriage, Engine & Drivetrain, Interior, Documentation + Authenticity & Provenance',
              tips: [
                'Numbers matching (engine, trans, body) dramatically affects value',
                'Use a magnet on body panels — if it doesn\'t stick, there\'s Bondo filler',
                'Check 8 critical rust areas: rockers, quarters, floor pans, trunk, frame',
                'Original documentation (build sheet, window sticker) adds significant value',
                'Most pre-1996 cars lack OBD — use Manual Entry mode',
              ],
            },
            {
              type: 'Motorcycle',
              color: 'border-red-500/30',
              sections: 'Controls & Electrical, Engine & Transmission, Frame/Wheels/Tires, Final Drive, Brakes & Suspension',
              tips: [
                'Check tire DOT date code — replace after 5-6 years regardless of tread',
                'Push down on forks and check for oil weeping at seals',
                'Sight down the frame from front and rear to check straightness',
                'Check chain/belt tension and sprocket teeth for wear',
                'Test clutch engagement feel and free play at lever',
              ],
            },
          ].map((v) => (
            <div key={v.type} className={`bg-dark-card border ${v.color} rounded-lg p-6 mb-4`}>
              <h3 className="text-lg font-bold text-light-text mb-2">{v.type}</h3>
              <p className="text-xs text-medium-text mb-3"><strong>Checklist sections:</strong> {v.sections}</p>
              <p className="text-xs font-semibold text-primary mb-2">Key Focus Areas:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-medium-text">
                {v.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          ))}
        </section>

        {/* ============================================================ */}
        {/* SECTION 16: ACCOUNT */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">16. Managing Your Account</h2>
          <p className="text-medium-text mb-4">Tap the <strong className="text-light-text">&quot;Profile&quot;</strong> tab to view your account info, change your password, or sign out.</p>

          <h3 className="text-xl font-semibold mb-3 text-primary">Changing Your Password</h3>
          <ol className="list-decimal list-inside space-y-2 text-medium-text">
            <li>Go to <strong className="text-light-text">Profile</strong></li>
            <li>Scroll to <strong className="text-light-text">&quot;Change Password&quot;</strong></li>
            <li>Enter current password, new password (8+ characters), and confirm</li>
            <li>Tap <strong className="text-light-text">&quot;Change Password&quot;</strong></li>
          </ol>
        </section>

        {/* ============================================================ */}
        {/* SECTION 17: ADMIN GUIDE */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">17. Admin: Managing Inspectors</h2>
          <p className="text-medium-text mb-6">If you are an administrator, you have additional tools for managing your inspection team.</p>

          <h3 className="text-xl font-semibold mb-3 text-primary">Creating a New Inspector Account</h3>
          <ol className="list-decimal list-inside space-y-2 mb-6 text-medium-text">
            <li>Open the Admin Panel</li>
            <li>Go to the <strong className="text-light-text">Customers</strong> tab</li>
            <li>Tap <strong className="text-light-text">&quot;+ Create Customer Account&quot;</strong></li>
            <li>Fill in their email, password, account type, and plan</li>
            <li>Tap <strong className="text-light-text">&quot;Create User&quot;</strong></li>
            <li>Give the inspector their email and password</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 text-primary">Managing Existing Accounts</h3>
          <div className="overflow-x-auto mb-6">
            <table className="manual-table w-full text-sm border border-dark-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-dark-card">
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-light-text border-b border-dark-border">What It Does</th>
                </tr>
              </thead>
              <tbody className="text-medium-text">
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Suspend / Activate</td><td className="px-4 py-2">Temporarily deactivate or reactivate an inspector&apos;s access</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Features</td><td className="px-4 py-2">Toggle specific features on/off (EV Module, Fraud Detection, AI Reports, etc.)</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Credits</td><td className="px-4 py-2">Set number of inspections allowed (-1 for unlimited)</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Password</td><td className="px-4 py-2">Reset the inspector&apos;s password</td></tr>
                <tr className="border-b border-dark-border"><td className="px-4 py-2 font-semibold text-light-text">Expiry</td><td className="px-4 py-2">Set license expiration (6 months, 1 year, 2 years, or custom date)</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-light-text">Cancel</td><td className="px-4 py-2">Permanently cancel the license</td></tr>
              </tbody>
            </table>
          </div>

          <div className="tip-box bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-300"><strong>License Expiry:</strong> New accounts default to 12 months. The Expires column is color-coded: <span className="text-green-400">green</span> = 30+ days, <span className="text-yellow-400">yellow</span> = under 30 days, <span className="text-red-400">red</span> = expired. Expired inspectors cannot perform inspections until you renew.</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 18: TROUBLESHOOTING */}
        {/* ============================================================ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">18. Troubleshooting</h2>
          <div className="space-y-4">
            {[
              { q: 'VIN won\'t decode', a: 'Make sure you entered exactly 17 characters. VINs never contain the letters I, O, or Q. Check for mix-ups between O/0 and I/1.' },
              { q: 'Report generation failed', a: 'Check your internet connection and try again. The AI service may be temporarily unavailable.' },
              { q: 'Photos won\'t upload', a: 'Make sure you granted camera access to the browser. Check your device storage. Try taking a new photo.' },
              { q: 'OBD scanner won\'t connect', a: 'Ensure the adapter is plugged in securely, ignition is ON, and Bluetooth is enabled. Some vehicles require engine running.' },
              { q: 'App looks outdated', a: 'Close the app completely and reopen. Or clear your browser cache (Settings > Safari/Chrome > Clear Cache).' },
              { q: 'Fraud detection says "Analysis failed"', a: 'Requires internet connection. Ensure photos are clear and not blurry. Try again in a few moments.' },
              { q: 'Cannot sign in', a: 'Double-check email for typos. Use "Forgot password?" to reset. Contact your administrator if your account may be suspended.' },
            ].map((item) => (
              <div key={item.q} className="bg-dark-card border border-dark-border rounded-lg p-4">
                <p className="font-semibold text-light-text text-sm mb-1">{item.q}</p>
                <p className="text-xs text-medium-text">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 19: QUICK REFERENCE CARD */}
        {/* ============================================================ */}
        <div className="manual-page-break" />
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-primary">19. Quick Reference Card</h2>
          <p className="text-medium-text mb-4">Print this page and keep it in your inspection kit.</p>

          <div className="bg-dark-card border-2 border-primary rounded-xl p-6 space-y-6">
            <div className="text-center border-b border-dark-border pb-4">
              <h3 className="text-xl font-extrabold text-primary">AI AUTO PRO &mdash; QUICK REFERENCE</h3>
            </div>

            <div>
              <h4 className="font-bold text-light-text text-sm mb-2">INSPECTION WORKFLOW</h4>
              <ol className="list-decimal list-inside space-y-1 text-xs text-medium-text">
                <li>Dashboard &rarr; + New Inspection</li>
                <li>Enter VIN &rarr; Select Vehicle Type &rarr; Decode</li>
                <li>Enter Odometer Reading</li>
                <li>Work through checklist: Pass / Fail / Concern / N/A + Photos + Notes</li>
                <li>(Optional) Advanced Fraud & Damage Detection</li>
                <li>(Optional) Run OBD Diagnostics</li>
                <li>Tap &quot;Finalize & Generate Report&quot;</li>
                <li>Deliver report: Email / PDF / Print</li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-light-text text-sm mb-2">CONDITION RATINGS</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2"><span className="bg-green-600 text-white font-bold px-2 py-0.5 rounded text-xs">Pass</span> <span className="text-medium-text">Good condition</span></div>
                  <div className="flex items-center gap-2"><span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-xs">Fail</span> <span className="text-medium-text">Needs repair now</span></div>
                  <div className="flex items-center gap-2"><span className="bg-yellow-600 text-white font-bold px-2 py-0.5 rounded text-xs">Concern</span> <span className="text-medium-text">Approaching failure</span></div>
                  <div className="flex items-center gap-2"><span className="bg-gray-600 text-white font-bold px-2 py-0.5 rounded text-xs">N/A</span> <span className="text-medium-text">Does not apply</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-light-text text-sm mb-2">VEHICLE GRADES</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2"><span className="bg-green-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">A</span> <span className="text-medium-text">Strong Buy (90+)</span></div>
                  <div className="flex items-center gap-2"><span className="bg-blue-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">B</span> <span className="text-medium-text">Buy with Confidence (80+)</span></div>
                  <div className="flex items-center gap-2"><span className="bg-yellow-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">C</span> <span className="text-medium-text">Buy with Caution (65+)</span></div>
                  <div className="flex items-center gap-2"><span className="bg-orange-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">D</span> <span className="text-medium-text">Negotiate or Walk (50+)</span></div>
                  <div className="flex items-center gap-2"><span className="bg-red-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">F</span> <span className="text-medium-text">Walk Away (under 50)</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-light-text text-sm mb-2">SCANNER MODES</h4>
                <div className="space-y-1 text-xs text-medium-text">
                  <p><strong className="text-light-text">Bluetooth</strong> = Cars, SUVs, EVs (OBD-II)</p>
                  <p><strong className="text-light-text">J1939</strong> = Commercial trucks (9-pin)</p>
                  <p><strong className="text-light-text">WiFi</strong> = iPhone/iPad</p>
                  <p><strong className="text-light-text">Manual</strong> = Classic cars, no scanner</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-light-text text-sm mb-2">PHOTO CHECKLIST</h4>
                <div className="space-y-1 text-xs text-medium-text">
                  <p>&#9744; Front &amp; rear straight-on</p>
                  <p>&#9744; Both side profiles</p>
                  <p>&#9744; All 4 corners (3/4 views)</p>
                  <p>&#9744; Close-ups of any damage</p>
                  <p>&#9744; Odometer &amp; VIN plate</p>
                  <p>&#9744; All tires</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-dark-border">
              <p className="text-xs text-medium-text">AI Auto Pro &mdash; Professional Vehicle Inspection System &mdash; &copy; 2026</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-dark-border">
          <p className="text-sm text-medium-text">AI Auto Pro &mdash; Professional Vehicle Inspection System</p>
          <p className="text-xs text-medium-text mt-1">&copy; 2026. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};
