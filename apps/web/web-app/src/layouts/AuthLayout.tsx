import { Outlet } from 'react-router-dom';

export const AuthLayout = () => (
  <main className="auth-layout">
    <section className="auth-shell" aria-label="Authentication">
      <p className="brand">FuelPass</p>
      <Outlet />
    </section>
  </main>
);
