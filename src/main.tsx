import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import JeopardyPlayApp from './JeopardyPlayApp';
import './styles/theme.css';
import './styles/app.css';
import './styles/polish.css';
import './styles/bingo-cards.css';
import './styles/caller-stage.css';
import './styles/library.css';
import './styles/memory.css';
import './styles/jeopardy.css';
import './styles/shell.css';
import './styles/print.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// A student join link (e.g. "yourapp.com/?play") renders a separate,
// student-only entry point instead of the teacher's app — a query param
// works on any static host without needing a server-side rewrite rule.
const isStudentJoin = new URLSearchParams(window.location.search).has('play');

createRoot(root).render(
  <StrictMode>{isStudentJoin ? <JeopardyPlayApp /> : <App />}</StrictMode>,
);
