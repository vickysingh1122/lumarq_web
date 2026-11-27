import { useCallback, useEffect, useRef, useState } from 'react';
import { modules } from '../contentCatalog.js';
import { adminRequest } from './api.js';
import { DataTable, SingleContent } from './DataTable.jsx';
import Profile from './Profile.jsx';
import './admin.css';

const menu = ['consultations', 'services', 'about', 'works', 'clients', 'settings', 'profile'];
const icons = {
  consultations: 'M4 4h16v12H9l-5 4V4Zm4 4h8m-8 4h5',
  services: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z',
  about: 'M4 20V8l8-4 8 4v12H4Zm5 0v-5h6v5m-6-9h.01m6 0h.01',
  works: 'M3 8h18v12H3zm5 0V4h8v4M3 12h18m-11 0v2h4v-2',
  clients: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4m-6-6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 0a4 4 0 0 1-2 3.5',
  settings: 'M4 7h16M4 12h16M4 17h16M8 5v4m8 1v4m-6 1v4',
  profile: 'M20 20a8 8 0 0 0-16 0m12-11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
};

function AdminBrand() {
  return <div className="admin-brand">
    <span className="admin-mark" aria-hidden="true"><i /><i /><i /></span>
    <span>Lumarq Digital<small>Admin workspace</small></span>
  </div>;
}

function activeModule() {
  const value = window.location.hash.slice(1);
  return menu.includes(value) ? value : 'consultations';
}

function Login({ onSignIn, initialError, notice }) {
  const [error, setError] = useState(initialError || '');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      onSignIn(await adminRequest('session', { method: 'POST', body }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <AdminBrand />
        <h1>Admin sign in</h1>
        <p className="admin-login-intro">Manage project enquiries and website content.</p>
        {notice && <p role="status" className="admin-feedback">{notice}</p>}
        <form onSubmit={submit} className="admin-login-form">
          <div className="admin-field"><label htmlFor="admin-email">Email</label>
            <input id="admin-email" name="email" type="email" autoComplete="username" required maxLength={254} /></div>
          <div className="admin-field"><label htmlFor="admin-password">Password</label>
            <input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={256} /></div>
          {error && <p role="alert" className="admin-error">{error}</p>}
          <button className="admin-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <a className="admin-site-link" href="/">Back to website</a>
      </div>
    </main>
  );
}

export default function Admin() {
  const [account, setAccount] = useState(undefined);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState('');
  const [resource, setResource] = useState(activeModule);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const onExpired = useCallback(() => { setError('Your session expired. Sign in again.'); setAccount(null); }, []);

  useEffect(() => {
    document.title = 'Admin | Lumarq Digital';
    const controller = new AbortController();
    adminRequest('session', { signal: controller.signal }).then(setAccount).catch(failure => {
      if (failure.name === 'AbortError') return;
      if (failure.status !== 401) setError(failure.message);
      setAccount(null);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onChange = () => { setResource(activeModule()); setError(''); setMenuOpen(false); };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  function accountSaved(result, changedPassword) {
    if (result.signInRequired) {
      setError('');
      setNotice(changedPassword ? 'Password updated. Sign in with your new password.' : 'Email updated. Sign in with your new email.');
      setAccount(null);
    } else {
      setAccount({ email: result.email, displayName: result.displayName });
    }
  }

  async function signOut() {
    try {
      await adminRequest('session', { method: 'DELETE' });
      setError('');
      setAccount(null);
    } catch (failure) {
      setError(failure.message);
    }
  }

  if (account === undefined) return <main className="admin-loading" aria-busy="true">Checking session…</main>;
  if (!account) return <Login onSignIn={value => { setAccount(value); setError(''); setNotice(''); }} initialError={error} notice={notice} />;

  const accountName = account.displayName || account.email;
  const currentTitle = resource === 'profile' ? 'Profile' : modules[resource].title;
  return (
    <div className="admin-shell">
      <a className="admin-skip" href="#admin-main" onClick={event => {
        event.preventDefault();
        document.getElementById('admin-main').focus();
      }}>Skip to content</a>
      <aside className="admin-sidebar" onKeyDown={event => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false);
          menuButton.current.focus();
        }
      }}>
        <div className="admin-sidebar-heading">
          <AdminBrand />
          <button ref={menuButton} className="admin-menu-toggle" type="button" aria-controls="admin-sidebar-links"
            aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>
            {menuOpen ? 'Close menu' : 'Menu'}
          </button>
        </div>
        <div id="admin-sidebar-links" className={menuOpen ? 'admin-sidebar-links is-open' : 'admin-sidebar-links'}>
          <nav aria-label="Admin modules">
            {menu.map(item => (
              <a key={item} href={'#' + item} aria-current={item === resource ? 'page' : undefined} onClick={() => {
                if (menuOpen) {
                  setMenuOpen(false);
                  requestAnimationFrame(() => document.getElementById('admin-main')?.focus());
                }
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[item]} /></svg>
                {item === 'profile' ? 'Profile' : modules[item].title}
              </a>
            ))}
          </nav>
          <a className="admin-site-link" href="/">View website</a>
        </div>
      </aside>
      <main className="admin-main" id="admin-main" tabIndex={-1}>
        <header className="admin-topbar">
          <span className="admin-location">Workspace <span aria-hidden="true">/</span> <strong>{currentTitle}</strong></span>
          <div className="admin-account">
            <a href="#profile" className="admin-account-link" aria-label={'Profile for ' + accountName}>
              <span className="admin-avatar" aria-hidden="true">{accountName.trim().charAt(0).toUpperCase()}</span>
              <span>{accountName}</span>
            </a>
            <button type="button" className="admin-secondary" onClick={signOut}>Sign out</button>
          </div>
        </header>
        <div className="admin-content">
          {error && <p role="alert" className="admin-error">{error}</p>}
          {resource === 'profile' ? <Profile account={account} onSaved={accountSaved} onExpired={onExpired} />
            : modules[resource].single
            ? <SingleContent key={resource} resource={resource} onExpired={onExpired} />
            : <DataTable key={resource} resource={resource} onExpired={onExpired} />}
        </div>
      </main>
    </div>
  );
}
