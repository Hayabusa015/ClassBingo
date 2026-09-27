import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import JeopardyPlayApp from './JeopardyPlayApp';
import GlitchPlayApp from './GlitchPlayApp';
import './styles/theme.css';
import './styles/app.css';
import './styles/polish.css';
import './styles/bingo-cards.css';
import './styles/caller-stage.css';
import './styles/library.css';
import './styles/memory.css';
import './styles/jeopardy.css';
import './styles/shell.css';
import './styles/modern.css';
import './styles/glitch.css';
import './styles/print.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// A student join link (e.g. "yourapp.com/?play" or "yourapp.com/?glitch")
// renders a separate, student-only entry point instead of the teacher's
// app — a query param works on any static host without needing a
// server-side rewrite rule.
const params = new URLSearchParams(window.location.search);
const isJeopardyJoin = params.has('play');
const isGlitchJoin = params.has('glitch');

createRoot(root).render(
  <StrictMode>
    {isJeopardyJoin ? <JeopardyPlayApp /> : isGlitchJoin ? <GlitchPlayApp /> : <App />}
  </StrictMode>,
);
