import { Outlet } from 'react-router-dom';

import { AppHeader } from '../components/navigation/AppHeader';

export const AppLayout = () => {
  return (
    <div className="app-layout">
      <AppHeader />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};
