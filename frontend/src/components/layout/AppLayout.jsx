import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ isAdmin }) {
  return (
    <div className="app-layout">
      <Sidebar isAdmin={isAdmin} />
      <div className="main-content">
        <Header isAdmin={isAdmin} />
        <main className="page-content animate-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
