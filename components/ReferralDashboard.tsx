import React, { useState, useEffect, useCallback } from 'react';
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8080';
const backendFetch = (path: string, opts?: RequestInit) =>
  fetch(`${BACKEND_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      ...(opts?.headers || {}),
    },
  });

interface ReferralTier {
  count: number;
  reward: number;
  bonus: number;
  title: string;
  badge: string;
}

interface ReferredUser {
  name: string;
  created_at: string;
  reward_amount: number;
  status: string;
}

interface LossAversionAlert {
  active: boolean;
  amount: number;
  hoursLeft: number;
  message: string;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  pendingCredit: number;
  paidCredit: number;
  currentTier: ReferralTier;
  nextTier: ReferralTier | null;
  progressToNext: number;
  referredUsers: ReferredUser[];
  lossAversionAlert: LossAversionAlert | null;
  identityTitle: string;
  identityBadge: string;
}

interface SocialFeedItem {
  message: string;
  timeAgo: string;
  reward_amount: number;
}

const BADGE_COLORS: Record<string, string> = {
  certified: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
  elite:     'bg-purple-600/20 text-purple-300 border-purple-500/40',
  master:    'bg-yellow-600/20 text-yellow-300 border-yellow-500/40',
  director:  'bg-orange-600/20 text-orange-300 border-orange-500/40',
  partner:   'bg-green-600/20 text-green-300 border-green-500/40',
};

const TIER_ICONS: Record<string, string> = {
  certified: '🏅',
  elite:     '⭐',
  master:    '🌟',
  director:  '🏆',
  partner:   '💎',
};

export const ReferralDashboard: React.FC = () => {
  const [data, setData] = useState<ReferralData | null>(null);
  const [feed, setFeed] = useState<SocialFeedItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedIndex, setFeedIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [dashRes, feedRes] = await Promise.all([
        backendFetch('/api/referral/dashboard'),
        backendFetch('/api/referral/social-feed'),
      ]);
      const dashJson = await dashRes.json();
      const feedJson = await feedRes.json();
      setData(dashJson);
      setFeed(feedJson.feed || []);
    } catch (err) {
      console.error('Referral load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Rotate social proof ticker every 4 seconds
  useEffect(() => {
    if (feed.length === 0) return;
    const interval = setInterval(() => {
      setFeedIndex(i => (i + 1) % feed.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [feed]);

  const copyLink = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-medium-text">
        <p>Unable to load referral data. Please refresh.</p>
      </div>
    );
  }

  const badgeClass = BADGE_COLORS[data.identityBadge] || BADGE_COLORS.certified;
  const tierIcon = TIER_ICONS[data.identityBadge] || '🏅';
  const totalEarned = data.pendingCredit + data.paidCredit;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── LOSS AVERSION ALERT (highest priority — shown first) ── */}
      {data.lossAversionAlert?.active && (
        <div className="bg-red-900/30 border-2 border-red-500/60 rounded-xl p-5 animate-pulse-slow">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⏰</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-300 text-lg mb-1">
                ${data.lossAversionAlert.amount} in Pending Credit — Expires in {data.lossAversionAlert.hoursLeft}h
              </h3>
              <p className="text-red-200/80 text-sm">{data.lossAversionAlert.message}</p>
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Share Now →
            </button>
          </div>
        </div>
      )}

      {/* ── IDENTITY TITLE (Lever 1: Identity Labeling) ── */}
      <div className="bg-dark-card rounded-xl border border-dark-border p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-medium-text mb-1">Your Professional Title</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tierIcon}</span>
              <div>
                <h2 className="text-2xl font-extrabold text-light-text">{data.identityTitle}</h2>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mt-1 ${badgeClass}`}>
                  {data.identityBadge.toUpperCase()} STATUS
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-medium-text mb-1">Total Earned</p>
            <p className="text-3xl font-extrabold text-green-400">${totalEarned.toLocaleString()}</p>
            {data.pendingCredit > 0 && (
              <p className="text-xs text-yellow-400 mt-0.5">${data.pendingCredit} pending payout</p>
            )}
          </div>
        </div>
      </div>

      {/* ── SOCIAL PROOF TICKER (Lever 4) ── */}
      {feed.length > 0 && (
        <div className="bg-dark-bg border border-dark-border rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-medium-text truncate transition-all duration-500">
              <span className="text-green-400 font-semibold">{feed[feedIndex]?.message}</span>
              <span className="text-medium-text/60 ml-2 text-xs">{feed[feedIndex]?.timeAgo}</span>
            </p>
          </div>
          <span className="text-xs text-medium-text shrink-0">Live Activity</span>
        </div>
      )}

      {/* ── PROGRESS BAR (Lever 3: Endowed Progress) ── */}
      {data.nextTier && (
        <div className="bg-dark-card rounded-xl border border-dark-border p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-light-text">
                {TIER_ICONS[data.nextTier.badge]} {data.nextTier.title} — {data.nextTier.count - data.totalReferrals} referral{data.nextTier.count - data.totalReferrals !== 1 ? 's' : ''} away
              </h3>
              <p className="text-xs text-medium-text mt-0.5">
                Unlock ${data.nextTier.reward} base reward + <span className="text-yellow-400 font-semibold">${data.nextTier.bonus} surprise bonus</span>
              </p>
            </div>
            <span className="text-2xl font-extrabold text-primary">{data.progressToNext}%</span>
          </div>
          <div className="w-full h-4 bg-dark-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000"
              style={{ width: `${data.progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-medium-text mt-2">
            {data.totalReferrals} of {data.nextTier.count} referrals to {data.nextTier.title}
          </p>
        </div>
      )}

      {/* ── REFERRAL LINK (Lever 5: Reciprocity Pre-load + Lever 6: Exclusivity) ── */}
      <div className="bg-dark-card rounded-xl border border-dark-border p-6">
        <h3 className="font-bold text-light-text mb-1">Your Private Access Link</h3>
        <p className="text-xs text-medium-text mb-4">
          This is your exclusive referral link. Anyone who licenses through it earns you $100 — plus surprise bonuses at every milestone.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={data.referralLink}
            className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm font-mono text-medium-text focus:outline-none focus:border-primary"
          />
          <button
            onClick={copyLink}
            className={`px-5 py-2.5 font-bold rounded-lg text-sm transition-all ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Share shortcuts */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {[
            {
              label: 'Share via Email',
              icon: '✉️',
              href: `mailto:?subject=I%20found%20the%20best%20AI%20inspection%20tool&body=I%20wanted%20to%20share%20this%20with%20you%20-%20it%27s%20the%20most%20advanced%20vehicle%20inspection%20platform%20I%27ve%20seen.%20Check%20it%20out%3A%20${encodeURIComponent(data.referralLink)}`,
            },
            {
              label: 'Share on LinkedIn',
              icon: '💼',
              href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.referralLink)}`,
            },
            {
              label: 'Share via SMS',
              icon: '📱',
              href: `sms:?body=Check%20out%20this%20AI%20vehicle%20inspection%20platform%20-%20it%27s%20incredible%3A%20${encodeURIComponent(data.referralLink)}`,
            },
          ].map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-medium-text border border-dark-border hover:border-primary/50 hover:text-light-text rounded-lg px-3 py-2 transition-colors"
            >
              <span>{s.icon}</span> {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── REWARD TIERS (Lever 2: Variable Reward / Dopamine Loop) ── */}
      <div className="bg-dark-card rounded-xl border border-dark-border p-6">
        <h3 className="font-bold text-light-text mb-1">Reward Milestones</h3>
        <p className="text-xs text-medium-text mb-4">
          Every milestone includes a <span className="text-yellow-400 font-semibold">surprise bonus</span> — the amount is revealed when you hit it.
        </p>
        <div className="space-y-2">
          {[
            { count: 1,  base: 100,  bonus: '?',   title: 'Certified Inspector',  badge: 'certified' },
            { count: 3,  base: 300,  bonus: '$100', title: 'Elite Inspector',      badge: 'elite'     },
            { count: 5,  base: 500,  bonus: '$250', title: 'Master Inspector',     badge: 'master'    },
            { count: 10, base: 1000, bonus: '$500', title: 'Regional Director',    badge: 'director'  },
            { count: 25, base: 2500, bonus: '$1,500',title: 'National Partner',    badge: 'partner'   },
          ].map(tier => {
            const isCompleted = data.totalReferrals >= tier.count;
            const isCurrent = data.currentTier.count === tier.count;
            return (
              <div
                key={tier.count}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isCompleted
                    ? 'border-green-500/40 bg-green-900/10'
                    : isCurrent
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-dark-border bg-dark-bg/40'
                }`}
              >
                <span className="text-xl w-8 text-center">{isCompleted ? '✅' : TIER_ICONS[tier.badge]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-light-text">{tier.title}</span>
                    <span className="text-xs text-medium-text">({tier.count} referrals)</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-light-text">${tier.base.toLocaleString()}</div>
                  <div className="text-xs text-yellow-400">+{tier.bonus} bonus</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── REFERRED USERS LIST ── */}
      {data.referredUsers.length > 0 && (
        <div className="bg-dark-card rounded-xl border border-dark-border p-6">
          <h3 className="font-bold text-light-text mb-4">Your Referrals ({data.totalReferrals})</h3>
          <div className="space-y-2">
            {data.referredUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-dark-border/50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-light-text">{u.name}</span>
                  <span className="text-xs text-medium-text ml-2">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-400">+${u.reward_amount}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.status === 'paid' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                  }`}>
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DONE-FOR-YOU EMAIL TEMPLATE (Lever 5: Reciprocity Pre-load) ── */}
      <div className="bg-dark-card rounded-xl border border-dark-border p-6">
        <h3 className="font-bold text-light-text mb-1">Done-For-You Referral Email</h3>
        <p className="text-xs text-medium-text mb-3">Copy this and send it to anyone you know in the inspection, auto, or fleet business.</p>
        <div className="bg-dark-bg rounded-lg p-4 border border-dark-border text-sm text-medium-text leading-relaxed font-mono whitespace-pre-wrap">
{`Subject: The AI inspection tool that's changing the business

Hey [Name],

I wanted to share something with you before it gets too crowded in your market.

I just licensed an AI vehicle inspection platform that covers every vehicle type — cars, trucks, EVs, 18-wheelers, RVs, classic cars, motorcycles — with AI fraud detection, odometer rollback analysis, flood damage AI, and CDL-grade commercial truck reports.

It's the most advanced inspection tool I've seen. Nothing else comes close.

If you're doing inspections (or thinking about it), this is worth 5 minutes:

${data.referralLink}

Territories are limited — once your area is taken, it's gone.

[Your Name]`}
        </div>
        <button
          onClick={() => {
            const text = document.querySelector('.font-mono')?.textContent || '';
            navigator.clipboard.writeText(text.replace('[Your Name]', '').trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
          className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Copy Email Template →
        </button>
      </div>

    </div>
  );
};

export default ReferralDashboard;
