import { useEffect, useRef, useState } from 'react';

export default function GoogleSignInButton({ onCredential, text = 'continue_with' }) {
  const targetRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

  useEffect(() => {
    if (!clientId) return undefined;
    let timer;
    const initialize = () => {
      const google = window.google?.accounts?.id;
      if (!google || !targetRef.current) return false;
      google.initialize({ client_id: clientId, callback: ({ credential }) => callbackRef.current(credential) });
      google.renderButton(targetRef.current, { theme: 'outline', size: 'large', shape: 'pill', text, width: 340 });
      setReady(true);
      return true;
    };
    if (!initialize()) timer = window.setInterval(() => { if (initialize()) window.clearInterval(timer); }, 250);
    return () => window.clearInterval(timer);
  }, [clientId, text]);

  if (!clientId) return <button className="button button-google full" disabled title="Set VITE_GOOGLE_CLIENT_ID in client/.env to enable Google sign-in"><span className="google-g">G</span> Continue with Google <span className="setup-hint">setup needed</span></button>;
  return <div ref={targetRef} className="google-button" aria-label="Continue with Google">{!ready && <span className="sr-only">Loading Google sign-in</span>}</div>;
}
