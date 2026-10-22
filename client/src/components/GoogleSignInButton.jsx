import { useEffect, useRef, useState } from 'react';

export default function GoogleSignInButton({ onCredential, text = 'signin_with' }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [rendered, setRendered] = useState(false);
  const [failed, setFailed] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return undefined;

    let timer;
    let isCancelled = false;

    const setupGoogleButton = () => {
      try {
        const google = window.google?.accounts?.id;
        const container = containerRef.current;
        if (!google || !container) return false;

        google.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential && callbackRef.current) {
              callbackRef.current(response.credential);
            }
          },
        });

        // Clear container before rendering to prevent iframe clash
        container.innerHTML = '';

        google.renderButton(container, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: text === 'signup_with' ? 'signup_with' : 'signin_with',
          width: 320,
        });

        if (!isCancelled) setRendered(true);
        return true;
      } catch (err) {
        console.warn('Google Sign-In button render error:', err);
        if (!isCancelled) setFailed(true);
        return true; // Stop polling on hard error
      }
    };

    if (!setupGoogleButton()) {
      let attempts = 0;
      timer = window.setInterval(() => {
        attempts += 1;
        if (setupGoogleButton() || attempts > 25) {
          window.clearInterval(timer);
          if (attempts > 25 && !isCancelled) {
            setFailed(true);
          }
        }
      }, 200);
    }

    return () => {
      isCancelled = true;
      if (timer) window.clearInterval(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [clientId, text]);

  // If no client ID or Google script was blocked by ad-blocker, show fallback button
  if (!clientId || failed) {
    return (
      <button
        type="button"
        className="button button-google full"
        disabled={!clientId}
        title={!clientId ? 'Set VITE_GOOGLE_CLIENT_ID in client/.env' : 'Click to sign in with Google'}
        onClick={() => {
          try {
            if (window.google?.accounts?.id && clientId) {
              window.google.accounts.id.prompt();
            }
          } catch (e) {
            console.warn(e);
          }
        }}
      >
        <span className="google-g">G</span> Continue with Google
      </button>
    );
  }

  return (
    <div
      className="google-button-wrapper"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '44px',
        width: '100%',
      }}
    >
      {/* Empty container specifically for Google to inject its iframe */}
      <div ref={containerRef} style={{ display: rendered ? 'flex' : 'none', justifyContent: 'center' }} />
      {!rendered && (
        <button type="button" className="button button-google full" disabled style={{ opacity: 0.6 }}>
          <span className="google-g">G</span> Loading Google sign-in...
        </button>
      )}
    </div>
  );
}
