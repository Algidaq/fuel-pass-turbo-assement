import { Outlet } from 'react-router-dom';

export const AuthLayout = () => (
  <main className="auth-layout">
    <section className="auth-shell" aria-label="Authentication">
      <div className="auth-brand" aria-label="FuelPass">
        <span className="auth-brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M7 3h7a2 2 0 0 1 2 2v14H5V5a2 2 0 0 1 2-2Z" />
            <path d="M8 6h5v4H8V6Z" />
            <path d="M16 7h2l2 2v8a2 2 0 0 1-2 2h-2" />
            <path d="M18 9v3" />
          </svg>
        </span>
        <span className="brand">FuelPass</span>
      </div>
      <Outlet />
      <footer className="auth-footer">FuelPass Operations Platform</footer>
    </section>
  </main>
);
