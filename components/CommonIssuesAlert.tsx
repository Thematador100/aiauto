import React, { useState, useEffect } from 'react';

interface CommonIssue {
  id: string;
  issue_category: string;
  issue_name: string;
  issue_description: string;
  symptoms: string[];
  severity: 'Critical' | 'Major' | 'Minor';
  failure_mileage_range: string;
  repair_cost_min: number;
  repair_cost_max: number;
  affected_percentage: number;
  detection_method: string;
  source: string;
}

interface CommonIssuesAlertProps {
  make: string;
  model: string;
  year: number;
  onIssuesLoaded?: (count: number) => void;
}

export const CommonIssuesAlert: React.FC<CommonIssuesAlertProps> = ({
  make,
  model,
  year,
  onIssuesLoaded
}) => {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<{
    critical: CommonIssue[];
    major: CommonIssue[];
    minor: CommonIssue[];
  } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchCommonIssues();
  }, [make, model, year]);

  const fetchCommonIssues = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/common-issues?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`
      );

      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues);
        if (onIssuesLoaded) {
          onIssuesLoaded(data.totalIssues);
        }
      } else {
        setIssues({ critical: [], major: [], minor: [] });
      }
    } catch (error) {
      console.error('Failed to fetch common issues:', error);
      setIssues({ critical: [], major: [], minor: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
        <p className="text-medium-text">Loading known issues for {year} {make} {model}...</p>
      </div>
    );
  }

  if (!issues || (issues.critical.length === 0 && issues.major.length === 0 && issues.minor.length === 0)) {
    return (
      <div className="bg-green-900/20 border border-green-500 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
          ✅ No Known Issues
        </h3>
        <p className="text-light-text mt-2">
          Great news! No widespread issues have been reported for the {year} {make} {model}.
        </p>
      </div>
    );
  }

  const totalIssues = issues.critical.length + issues.major.length + issues.minor.length;

  const renderIssue = (issue: CommonIssue) => {
    const isExpanded = expanded === issue.id;
    const severityColor =
      issue.severity === 'Critical' ? 'text-red-400' :
      issue.severity === 'Major' ? 'text-yellow-400' :
      'text-blue-400';

    return (
      <div
        key={issue.id}
        className="bg-dark-bg p-4 rounded-lg border border-dark-border"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className={`font-bold ${severityColor}`}>
              {issue.severity === 'Critical' && '🔴'}
              {issue.severity === 'Major' && '🟡'}
              {issue.severity === 'Minor' && '🔵'}
              {' '}{issue.issue_name}
            </h4>
            <p className="text-sm text-medium-text mt-1">{issue.issue_category}</p>
          </div>
          <button
            onClick={() => setExpanded(isExpanded ? null : issue.id)}
            className="text-primary hover:text-primary-light text-sm font-semibold"
          >
            {isExpanded ? 'Show Less' : 'Details'}
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-medium-text">Affected:</span>{' '}
            <span className="text-light-text font-semibold">{issue.affected_percentage}%</span>
          </div>
          <div>
            <span className="text-medium-text">Mileage:</span>{' '}
            <span className="text-light-text">{issue.failure_mileage_range}</span>
          </div>
          <div className="col-span-2">
            <span className="text-medium-text">Repair Cost:</span>{' '}
            <span className="text-light-text font-semibold">
              ${issue.repair_cost_min.toLocaleString()} - ${issue.repair_cost_max.toLocaleString()}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <h5 className="text-light-text font-semibold mb-1">Description:</h5>
              <p className="text-medium-text">{issue.issue_description}</p>
            </div>

            {issue.symptoms && issue.symptoms.length > 0 && (
              <div>
                <h5 className="text-light-text font-semibold mb-1">Symptoms:</h5>
                <ul className="list-disc list-inside text-medium-text space-y-1">
                  {issue.symptoms.map((symptom, i) => (
                    <li key={i}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h5 className="text-light-text font-semibold mb-1">How to Check:</h5>
              <p className="text-medium-text">{issue.detection_method}</p>
            </div>

            <div className="pt-2 border-t border-dark-border">
              <p className="text-xs text-medium-text">
                Source: {issue.source}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const displayedCritical = showAll ? issues.critical : issues.critical.slice(0, 2);
  const displayedMajor = showAll ? issues.major : issues.major.slice(0, 2);
  const hiddenCount =
    (issues.critical.length - displayedCritical.length) +
    (issues.major.length - displayedMajor.length) +
    (showAll ? 0 : issues.minor.length);

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border-2 ${
        issues.critical.length > 0 ? 'bg-red-900/20 border-red-500' :
        issues.major.length > 0 ? 'bg-yellow-900/20 border-yellow-500' :
        'bg-blue-900/20 border-blue-500'
      }`}>
        <h3 className="text-xl font-bold text-light-text flex items-center gap-2">
          ⚠️ Known Issues for {year} {make} {model}
        </h3>
        <p className="text-medium-text mt-1">
          {totalIssues} known issue{totalIssues !== 1 ? 's' : ''} found
          {' '}({issues.critical.length} critical, {issues.major.length} major, {issues.minor.length} minor)
        </p>
        <p className="text-sm text-light-text mt-2">
          💡 <strong>Inspector:</strong> Pay special attention to these areas during your inspection.
        </p>
      </div>

      {/* Critical Issues */}
      {issues.critical.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-red-400 mb-2">
            🔴 Critical Issues ({issues.critical.length})
          </h4>
          <div className="space-y-2">
            {displayedCritical.map(renderIssue)}
          </div>
        </div>
      )}

      {/* Major Issues */}
      {issues.major.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-yellow-400 mb-2">
            🟡 Major Issues ({issues.major.length})
          </h4>
          <div className="space-y-2">
            {displayedMajor.map(renderIssue)}
          </div>
        </div>
      )}

      {/* Minor Issues (only if showAll) */}
      {showAll && issues.minor.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-blue-400 mb-2">
            🔵 Minor Issues ({issues.minor.length})
          </h4>
          <div className="space-y-2">
            {issues.minor.map(renderIssue)}
          </div>
        </div>
      )}

      {/* Show More/Less Button */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full bg-dark-card hover:bg-dark-bg border border-dark-border text-primary font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {showAll ? 'Show Less' : `Show ${hiddenCount} More Issue${hiddenCount !== 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
};
