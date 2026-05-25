// ──────────────────────────────────────────────
// KidsVerse — Application Entry Point
// ──────────────────────────────────────────────
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { router } from '@/app/Router';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('kidsverse-root')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>
);
