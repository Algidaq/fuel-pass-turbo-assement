import { Link } from 'react-router-dom';

import { routes } from '../routes/roleRoutes';

export const NotFoundPage = () => (
  <main className="not-found-page">
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
    <Link to={routes.login}>Return to sign in</Link>
  </main>
);
