import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import './styles/app.css';
import './styles/polish.css';
import './styles/bingo-cards.css';
import './styles/caller-stage.css';
import './styles/library.css';
import './styles/print.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
