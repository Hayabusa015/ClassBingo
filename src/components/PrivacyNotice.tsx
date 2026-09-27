import { useEffect, useState } from 'react';
import { loadState, saveState } from '../lib/storage';

const ACK_KEY = 'privacyNoticeAck';

interface Props {
  onOpenPrivacy: () => void;
}

/**
 * A one-time, honest notice about what StudyArcade stores — not a cookie
 * banner, since the app doesn't use cookies or tracking. Dismissing it just
 * sets a localStorage flag, the same mechanism it's describing.
 */
export default function PrivacyNotice({ onOpenPrivacy }: Props) {
  const [dismissed, setDismissed] = useState(() => loadState<boolean>(ACK_KEY) ?? false);

  // The banner is fixed to the viewport, so on a long scrollable page (like
  // the legal pages) it can sit on top of the last bit of content — this
  // reserves that space at the bottom of the document instead.
  useEffect(() => {
    document.body.classList.toggle('has-privacy-notice', !dismissed);
    return () => document.body.classList.remove('has-privacy-notice');
  }, [dismissed]);

  if (dismissed) return null;

  const dismiss = () => {
    saveState(ACK_KEY, true);
    setDismissed(true);
  };

  return (
    <div className="privacy-notice" role="dialog" aria-label="Privacy notice">
      <p>
        StudyArcade saves your theme and playsets in your browser only — no accounts, no ads, no tracking.
        Live Jeopardy games sync player first names through our database to run in real time.{' '}
        <button className="privacy-notice-link" onClick={onOpenPrivacy}>
          Privacy Policy
        </button>
      </p>
      <button className="btn btn-primary privacy-notice-dismiss" onClick={dismiss}>
        Got it
      </button>
    </div>
  );
}
