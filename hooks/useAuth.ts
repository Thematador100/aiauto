import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

/**
 * Phase 2C: Real authentication hook with license enforcement
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Verify license status from backend (non-blocking)
          refreshLicenseStatus(token, parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Refresh license status from backend
  const refreshLicenseStatus = async (token: string, currentUser: User) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/license-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = {
          ...currentUser,
          licenseStatus: data.licenseStatus,
          featuresEnabled: data.featuresEnabled
        };
        setUser(updatedUser);

        // Update stored user
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      // Silently fail - user can still use cached data
      console.warn('Failed to refresh license status:', error);
    }
  };

  // Login function
  const login = (token: string, userData: any) => {
    setUser({
      id: userData.id,
      email: userData.email,
      plan: userData.plan,
      userType: userData.userType,
      companyName: userData.companyName,
      inspectionCredits: userData.inspectionCredits,
      subscriptionStatus: userData.subscriptionStatus,
      licenseStatus: userData.licenseStatus || 'active',
      featuresEnabled: userData.featuresEnabled || {},
    });
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  // Check license - callable by components
  const checkLicense = useCallback(async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && user) {
      await refreshLicenseStatus(token, user);
    }
  }, [user]);

  return { user, login, logout, isLoading, checkLicense };
};
