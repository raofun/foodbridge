import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { session } = useAuth();
  return <>
    <div className="page-title"><div><span className="eyebrow">YOUR FOODBRIDGE</span><h1>Hello, <em>{session.user.name.split(' ')[0]}.</em></h1><p>Small acts of sharing make a real difference.</p></div><div className="live-pill"><span /> MODULE 01</div></div>
    {session.user.role === 'donor' ? <div className="panel dashboard-welcome"><span className="eyebrow">DONOR WORKSPACE</span><h2>Ready to share surplus food?</h2><p>Create a listing in three steps: describe the food, add preparation and storage information, then set its pickup window.</p><div className="dashboard-actions"><Link className="button button-primary" to="/dashboard/listings/new">Create a listing <span>↗</span></Link><Link className="button button-google" to="/dashboard/listings/mine">View my listings</Link></div></div> : <div className="notice info">Your account is set up as a {session.user.role}. Donor food listing tools are available to donor accounts.</div>}
  </>;
}
