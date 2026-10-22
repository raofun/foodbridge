import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/global.css';
import './styles/auth.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('FoodBridge Application Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#080b10',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'DM Sans', sans-serif",
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#ff5e1a' }}>Something went wrong</h2>
          <p style={{ color: '#94a3b8', maxWidth: '420px', fontSize: '14px', marginBottom: '24px' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering the page.'}
          </p>
          <button
            onClick={() => {
              try { localStorage.clear(); } catch {}
              window.location.href = '/login';
            }}
            style={{
              backgroundColor: '#ff5e1a',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Reset Session & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>,
);
