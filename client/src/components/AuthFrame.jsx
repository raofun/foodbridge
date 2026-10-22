export default function AuthFrame({ children }) {
  return <div className="auth-layout">
    <aside className="welcome-panel">
      <div className="brand brand-light"><span className="brand-mark">f</span> foodbridge</div>
      <div className="welcome-copy">
        <span className="eyebrow">GOOD FOOD, PASSED FORWARD</span>
        <h1>Make a little<br /><em>go a long way.</em></h1>
        <p>Bring good food to the people who need it. Every meal deserves a better next chapter.</p>
      </div>
      <div className="welcome-art" aria-hidden="true"><span>✳</span><span>↗</span><span>◌</span></div>
      <div className="welcome-footer">A community-powered way to share surplus.</div>
    </aside>
    <main className="auth-main">
      <div className="mobile-brand brand"><span className="brand-mark">f</span> foodbridge</div>
      {children}
      <div className="auth-bottom">Made for better food days <span>✳</span></div>
    </main>
  </div>;
}
