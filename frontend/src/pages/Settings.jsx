// ── Settings / OAuth Redirect Trampoline ────────────────────────────
// This component acts as an invisible "traffic cop" for OAuth callbacks.
// After the backend redirects here with ?connected=... or ?error=...,
// it reads the saved returnPath from localStorage, refreshes user state
// if needed, then immediately routes the user back to their dashboard.
// Uses replace: true to prevent /settings from polluting browser history.

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

const Settings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // ── Status message shown briefly during the redirect ──────────────
  const [statusMessage, setStatusMessage] = useState('Routing...');

  useEffect(() => {
    // ── 1. Read and clear the saved return path ─────────────────────
    const returnPath = localStorage.getItem('returnPath') || '/dashboard/youtube';
    localStorage.removeItem('returnPath');

    // ── 2. Parse OAuth callback query parameters ────────────────────
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    // Combine path and search params
    const paramsStr = searchParams.toString();
    const finalPath = paramsStr ? `${returnPath}?${paramsStr}` : returnPath;

    // ── 3. Handle success — refresh user context before redirecting ─
    if (connected) {
      setStatusMessage(`Connected ${connected}! Redirecting...`);
      // Refresh user data so the dashboard has updated connection info
      refreshUser().finally(() => {
        navigate(finalPath, { replace: true });
      });
      return;
    }

    // ── 4. Handle error — still route back, dashboard will show toast
    if (error) {
      setStatusMessage('Connection issue detected. Redirecting...');
    }

    // ── 5. Redirect immediately (success without platform, error, or direct visit)
    navigate(finalPath, { replace: true });
  }, [searchParams, navigate, refreshUser]);

  // ── Minimal loading UI shown while the redirect processes ─────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 animate-pulse">
        <Loader className="text-purple-500 animate-spin mx-auto" size={32} />
        <p className="text-sm text-slate-400 font-medium">{statusMessage}</p>
      </div>
    </div>
  );
};

export default Settings;

