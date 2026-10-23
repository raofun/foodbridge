import { UtensilsCrossed, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import '../styles/auth.css';

export default function AuthFrame({ children }) {
  return (
    <div className="auth-viewport-stage">
      {/* Bespoke Food Rescue Network Route Background (Pure SVG vector, 0KB assets, 60fps) */}
      <div className="auth-route-canvas" aria-hidden="true">
        {/* Dual Horizon Light Blooms */}
        <div className="auth-sunset-glow" />
        <div className="auth-ambient-sunspot" />

        {/* Vector Contour & Transit Lines Connecting Surplus Donors to Community Hubs */}
        <svg className="auth-contour-map" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5e1a" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ff9100" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="nodeGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff5e1a" />
              <stop offset="100%" stopColor="#ff9100" />
            </linearGradient>
            <linearGradient id="nodeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>

          {/* Organic Topographic Contour Ribbons */}
          <path d="M-100 240 C320 180, 540 380, 920 280 C1200 200, 1380 340, 1600 290" stroke="url(#routeGrad)" strokeWidth="1.6" strokeDasharray="6 8" className="route-path-anim-1" />
          <path d="M-60 480 C280 400, 600 580, 980 460 C1260 380, 1420 540, 1600 480" stroke="url(#routeGrad)" strokeWidth="1.2" />
          <path d="M-80 680 C360 620, 720 740, 1100 620 C1320 550, 1460 660, 1600 610" stroke="url(#routeGrad)" strokeWidth="1" strokeDasharray="4 6" />
          
          {/* Rescue Flow Arc */}
          <path d="M120 780 C400 450, 800 520, 1340 180" stroke="url(#routeGrad)" strokeWidth="2.2" strokeDasharray="8 10" className="route-path-anim-2" />

          {/* Community Hub Node Markers with dual-tone contrast */}
          <circle cx="280" cy="400" r="3.5" fill="url(#nodeGrad1)" className="node-pulse" />
          <circle cx="600" cy="580" r="5" fill="url(#nodeGrad2)" className="node-pulse" />
          <circle cx="980" cy="460" r="4.5" fill="url(#nodeGrad1)" className="node-pulse" />
          <circle cx="1260" cy="380" r="3.5" fill="url(#nodeGrad2)" className="node-pulse" />
          <circle cx="540" cy="380" r="4" fill="url(#nodeGrad1)" className="node-pulse" />
          <circle cx="920" cy="280" r="4" fill="url(#nodeGrad2)" className="node-pulse" />
        </svg>
      </div>

      {/* Top Header Bar */}
      <header className="auth-header-bar">
        <a href="/" className="auth-brand-badge">
          <div className="auth-brand-icon">
            <UtensilsCrossed size={17} strokeWidth={2.4} />
          </div>
          <span>FoodBridge</span>
        </a>

        <div className="auth-status-chip">
          <span className="auth-pulse-dot" />
          <span>Surplus Rescue Network</span>
        </div>
      </header>

      {/* Central Viewport Card (Children: Register or Login) */}
      {children}

      {/* Bottom Footer Note (Guaranteed single-viewport) */}
      <footer className="auth-bottom-banner">
        <span><ShieldCheck size={13} style={{ color: 'var(--fb-mint-spark)' }} /> Verified Safety</span>
        <span>•</span>
        <span><HeartHandshake size={13} style={{ color: 'var(--fb-orange-bright)' }} /> Direct Community Connect</span>
        <span>•</span>
        <span><Sparkles size={13} style={{ color: 'var(--fb-mint-spark)' }} /> Zero Waste</span>
      </footer>
    </div>
  );
}
