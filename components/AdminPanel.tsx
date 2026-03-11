import React from 'react';

export const AdminPanel: React.FC = () => {
    return (
        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
            <h2 className="text-2xl font-semibold text-light-text">Admin Panel</h2>
            <p className="text-medium-text mt-2">
                This is a placeholder for the Admin Panel. Future functionality could include user management,
                report analytics, and application configuration.
            </p>
            <div className="mt-4 bg-dark-bg p-8 rounded-md text-center border-2 border-dashed border-dark-border">
                <p className="text-medium-text">Admin Features Coming Soon</p>
            </div>
        </div>
    );
};
