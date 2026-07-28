import React from 'react';
import { createRoot } from 'react-dom/client';
import RadbroReefRun from './RadbroReefRun';

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <RadbroReefRun />
    </React.StrictMode>,
  );
}
