import { useEffect, useState } from 'react';

/**
 * Only renders inside the Electron desktop build (feature-detected via
 * window.classbingoDesktop, injected by electron/preload.cjs) — the web
 * build has nothing to check for updates against, so it renders nothing.
 */
export default function UpdateChecker() {
  const [version, setVersion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const desktop = typeof window !== 'undefined' ? window.classbingoDesktop : undefined;

  useEffect(() => {
    desktop?.getAppVersion().then(setVersion).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!desktop) return null;

  const handleClick = async () => {
    setChecking(true);
    try {
      await desktop.checkForUpdates();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="update-checker">
      <button className="btn btn-ghost" onClick={handleClick} disabled={checking} title="Check GitHub for a newer version">
        {checking ? 'Checking…' : '🔄 Check for Updates'}
      </button>
      {version && <span className="app-version-stamp">v{version}</span>}
    </div>
  );
}
