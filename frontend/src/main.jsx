import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

const page = window.location.pathname.replace(/\/$/, '') === '/admin'
  ? () => import('./admin/Admin.jsx')
  : () => import('./App.jsx');
const Page = lazy(page);

createRoot(document.getElementById('root')).render(
  <Suspense fallback={null}><Page /></Suspense>,
);
