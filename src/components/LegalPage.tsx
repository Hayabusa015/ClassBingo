import ThemeToggle from './ThemeToggle';
import type { Theme } from '../lib/gameConfig';

const LAST_UPDATED = 'September 27, 2026';
const CONTACT_EMAIL = 'm.shull15@gmail.com';

interface Props {
  page: 'privacy' | 'terms';
  onBack: () => void;
  theme: Theme;
  onCycleTheme: () => void;
}

export default function LegalPage({ page, onBack, theme, onCycleTheme }: Props) {
  return (
    <main className="page page-legal">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <h1>{page === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h1>
        <div className="legal-header-toggle">
          <ThemeToggle theme={theme} onCycle={onCycleTheme} />
        </div>
      </header>
      <div className="legal-body">
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
        {page === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
      </div>
    </main>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <p>
        StudyArcade is a free set of classroom review games — Bingo, Memory, and live Jeopardy — built and
        maintained independently by a classroom science teacher. This page explains, plainly, what data the
        app touches and why.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>There are no accounts, logins, or passwords anywhere in StudyArcade today.</li>
        <li>
          Your theme, sound setting, and any playsets you build or save stay on your own device (in your
          browser's local storage) and are never uploaded anywhere.
        </li>
        <li>
          The only feature that sends anything to a server is <strong>live Jeopardy</strong>: hosting or
          joining a game sends the board content and each player's first name to our database so the game
          can sync in real time.
        </li>
        <li>We don't use analytics, advertising, or tracking scripts of any kind.</li>
      </ul>

      <h2>What we collect</h2>
      <h3>Stored only on your device</h3>
      <p>
        Your selected theme, sound preference, in-progress Bingo game (so the "resume" prompt works), and any
        playsets you build or import are stored using your browser's <code>localStorage</code>. None of this
        is transmitted to us or anyone else. Clearing your browser's site data, or using the "Delete saved
        playset" button in the app, removes it. Exporting your library creates a JSON file on your own
        computer that you control.
      </p>
      <h3>Only when you host or join a live Jeopardy game</h3>
      <p>To run a live multiplayer game in real time, the following is sent to our database (provided by
        Supabase, hosted in the United States):</p>
      <ul>
        <li>The game code, and the categories/clues/answers the host typed into the board.</li>
        <li>For each player who joins: the first name they type to join, their running score, and their
          buzz-in and Final Jeopardy activity (which clue, when, and whether it was marked correct).</li>
        <li>Wager amounts and typed answers submitted for Daily Double and Final Jeopardy.</li>
      </ul>
      <p>
        We do not ask for — and the app has no field for — last names, emails, birthdates, or any other
        contact or identifying information. This data exists only to run that one game session.
      </p>
      <p>
        <strong>Retention:</strong> a live game's data is automatically and permanently deleted from our
        database 7 days after it was created, whether or not the host formally ended it. Until then, you can
        email us (below) to request early deletion of a specific game.
      </p>

      <h2>What we don't do</h2>
      <ul>
        <li>No accounts, no passwords, no email collection.</li>
        <li>No analytics, no advertising, no tracking pixels or cookies used for tracking.</li>
        <li>We never sell or share data with advertisers or data brokers.</li>
      </ul>

      <h2>Third-party services we rely on</h2>
      <p>Running StudyArcade depends on a small number of infrastructure providers, each of which may see
        standard technical information (like your IP address) simply by virtue of how the web works:</p>
      <ul>
        <li><strong>Vercel</strong> — hosts the website and, like any host, automatically logs basic request
          data (IP address, timestamps) for security and reliability.</li>
        <li><strong>Supabase</strong> — hosts the database used only for live Jeopardy games, described
          above.</li>
        <li><strong>Google Fonts</strong> — the arcade display font is loaded from Google's font service,
          which may see your IP address as part of that request, per Google's own privacy policy.</li>
        <li><strong>GitHub</strong> — the optional desktop app checks GitHub Releases for newer versions; this
          is a version check only and doesn't send any personal data.</li>
      </ul>
      <p>None of these providers are used by us for advertising or cross-site tracking.</p>

      <h2>Classroom &amp; children's privacy</h2>
      <p>
        StudyArcade is meant to be used under a teacher's direction as part of a lesson, not signed up for
        directly by students. The only information a student ever enters is a first name, to join a live
        Jeopardy game their teacher is hosting — never an email address or other contact information.
        StudyArcade is not directed at children as a consumer product, and it is the responsibility of the
        teacher using the app to follow their own school or district's policies on classroom technology and
        student data before using any real names or game codes with students.
      </p>

      <h2>Your choices</h2>
      <p>
        Because almost everything lives in your own browser, you're already in control of it: clear your
        browser's site data at any time, remove a saved playset from the "My playsets" view, or export your
        library before clearing anything so you have a backup. For data generated by a live Jeopardy game,
        email us at the address below to ask what we have or to request it be deleted before its automatic
        7-day expiry.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes, we'll update the "Last updated" date above. Continuing to use StudyArcade
        after a change means you accept the updated policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy, or a request about live-game data, can be sent to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}

function TermsOfService() {
  return (
    <>
      <p>
        These terms cover your use of StudyArcade (the "Service"). By using the Service, you agree to them.
        If you don't agree, please don't use the Service.
      </p>

      <h2>What StudyArcade is</h2>
      <p>
        StudyArcade is a free tool for running classroom review games — Bingo, Memory, and live Jeopardy — in
        a web browser or the optional desktop app. It's provided as-is, by an independent developer, with no
        guarantee of uptime, accuracy, or fitness for any particular purpose.
      </p>

      <h2>No accounts, your content is yours</h2>
      <p>
        StudyArcade doesn't require an account. Any playset, board, or other content you create or import
        remains yours. Content you save locally stays in your own browser and is never uploaded to us,
        except for the board content and player activity of a live Jeopardy game you choose to host or join,
        which is handled as described in the Privacy Policy.
      </p>

      <h2>Acceptable use</h2>
      <p>When using StudyArcade, you agree not to:</p>
      <ul>
        <li>Use a live Jeopardy game code or session to collect, expose, or solicit sensitive personal
          information about real people, including students.</li>
        <li>Submit content that is unlawful, harassing, discriminatory, or infringes someone else's
          intellectual property or privacy rights.</li>
        <li>Attempt to disrupt, overload, or gain unauthorized access to the Service or its underlying
          infrastructure.</li>
      </ul>

      <h2>Classroom responsibility</h2>
      <p>
        If you use StudyArcade with students, you (the teacher or host) are responsible for how the game code
        or join link is shared, for following your school or district's technology and student-data policies,
        and for whatever names or content are entered during the session.
      </p>

      <h2>No warranty; limitation of liability</h2>
      <p>
        The Service is provided "as is" and "as available," without warranties of any kind, express or
        implied. In particular: locally stored data (your saved playsets, theme, and in-progress games) can
        be lost if you clear your browser's storage, switch devices, or reinstall — export your library
        periodically if you want a backup. To the fullest extent permitted by law, the developer is not
        liable for any indirect, incidental, or consequential damages arising from use of the Service,
        including lost data or a disrupted class period.
      </p>

      <h2>Third-party services</h2>
      <p>
        StudyArcade depends on third-party infrastructure (Vercel for hosting, Supabase for the live Jeopardy
        database, Google Fonts, and GitHub for optional desktop updates). Availability of the Service depends
        on theirs.
      </p>

      <h2>Changes</h2>
      <p>
        We may update the Service or these terms from time to time. Material changes will be reflected by
        updating the "Last updated" date on this page and the Privacy Policy.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the State of Ohio, USA, without regard to conflict-of-law
        principles.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
