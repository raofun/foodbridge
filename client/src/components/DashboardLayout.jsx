import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardLayout() {
  const { session, signOut } = useAuth();
  return <div className="dashboard">
    <header className="topbar">
      <NavLink to="/dashboard" className="brand"><span className="brand-mark">f</span> foodbridge</NavLink>
      <div className="topbar-right"><span className="avatar">{session.user.name.charAt(0).toUpperCase()}</span><span className="user-name">{session.user.name}</span><button className="signout" onClick={signOut}>Sign out</button></div>
    </header>
    <div className="dashboard-wrap">
      <aside className="sidebar"><span className="eyebrow">YOUR WORKSPACE</span>
        <NavLink end to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' selected' : ''}`}><span>⌂</span> Overview</NavLink>
        {session.user.role === 'donor' && <>
          <NavLink to="/dashboard/listings/new" className={({ isActive }) => `nav-item${isActive ? ' selected' : ''}`}><span>＋</span> Create listing</NavLink>
          <NavLink to="/dashboard/listings/mine" className={({ isActive }) => `nav-item${isActive ? ' selected' : ''}`}><span>▦</span> My listings</NavLink>
        </>}
        <div className="sidebar-note"><span>✳</span><p>Good things grow when we share them.</p></div>
      </aside>
      <main className="dashboard-main"><Outlet /></main>
    </div>
  </div>;
}
