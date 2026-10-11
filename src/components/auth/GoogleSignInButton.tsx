import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleAuthModal } from './GoogleAuthModal';
import { HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = 'signin',
  onSuccess,
  className = ''
}) => {
  const { loginWithGoogle } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGisReady, setIsGisReady] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const tokenClientRef = useRef<any>(null);

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '364422628626-mbvrd1km2eo2jjj8l9tc5uijbmut6913.apps.googleusercontent.com';

  useEffect(() => {
    let intervalId: any = null;
    let attempts = 0;

    const initGis = () => {
      if (!window.google?.accounts) {
        attempts++;
        if (attempts > 30) {
          clearInterval(intervalId);
        }
        return;
      }

      clearInterval(intervalId);
      setIsGisReady(true);

      try {
        // 1. Initialize Google Identity Services ID token callback
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setIsLoading(true);
              setErrorMsg(null);
              try {
                await loginWithGoogle({ credential: response.credential });
                if (onSuccess) onSuccess();
              } catch (err: any) {
                console.error('Google One Tap error:', err);
                setErrorMsg(err.message || 'Google authentication failed');
              } finally {
                setIsLoading(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // 2. Initialize OAuth 2.0 Token Client for standard direct popup flow
        if (window.google.accounts.oauth2) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                console.warn('Google OAuth prompt error:', tokenResponse);
                if (tokenResponse.error === 'popup_closed_by_user') {
                  return;
                }
                setErrorMsg(`Google auth: ${tokenResponse.error_description || tokenResponse.error}`);
                setIsModalOpen(true);
                return;
              }

              if (tokenResponse.access_token) {
                setIsLoading(true);
                setErrorMsg(null);
                try {
                  await loginWithGoogle({ accessToken: tokenResponse.access_token });
                  if (onSuccess) onSuccess();
                } catch (err: any) {
                  console.error('Google token sign-in error:', err);
                  setErrorMsg(err.message || 'Failed to authenticate Google user');
                } finally {
                  setIsLoading(false);
                }
              }
            }
          });
        }
      } catch (err: any) {
        console.warn('GIS Initialization notice:', err);
      }
    };

    if (window.google?.accounts) {
      initGis();
    } else {
      intervalId = setInterval(initGis, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [googleClientId, loginWithGoogle, onSuccess]);

  const handleClick = () => {
    setErrorMsg(null);

    // If OAuth2 Token Client is available, launch Google Popup
    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e: any) {
        console.warn('requestAccessToken failed, falling back to One Tap prompt:', e);
      }
    }

    // Fallback: try One Tap prompt
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('Google One Tap not displayed:', notification.getNotDisplayedReason());
            setIsModalOpen(true);
          }
        });
        return;
      } catch (e) {
        console.warn('One Tap prompt call failed:', e);
      }
    }

    // Default: open the Google helper modal
    setIsModalOpen(true);
  };

  const truncatedClientId = googleClientId
    ? `${googleClientId.substring(0, 12)}...${googleClientId.substring(googleClientId.indexOf('.'))}`
    : '';

  return (
    <>
      <div className={`space-y-1.5 ${className}`}>
        {/* Action Button Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group"
          >
            {/* Official Google G Logo SVG */}
            <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isLoading
                ? 'Authenticating with Google...'
                : mode === 'signup'
                ? 'Sign up with Google'
                : 'Sign in with Google'}
            </span>
          </button>

          {/* Setup Guide Info Tooltip / Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Google Sign-In & MongoDB Setup Guide"
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Client ID Status Micro-Badge */}
        {googleClientId && (
          <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Google Client ID active</span>
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Verify Origin
            </button>
          </div>
        )}

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="block text-blue-700 dark:text-blue-300 font-bold underline mt-0.5 cursor-pointer"
              >
                Open Google origin setup guide
              </button>
            </div>
          </div>
        )}

        {/* Invisible container for GIS button fallback */}
        <div ref={googleBtnContainerRef} className="hidden" />
      </div>

      <GoogleAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={mode}
        onSuccess={onSuccess}
      />
    </>
  );
};
