import { useCallback, useEffect, useState } from 'react';
import { modules } from '../contentCatalog.js';
import { adminRequest } from './api.js';
import { DataTable, SingleContent } from './DataTable.jsx';
import Profile from './Profile.jsx';
import './admin.css';

const menu = ['consultations', 'services', 'about', 'works', 'clients', 'settings', 'profile'];

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
        <span className="admin-brand">Lumarq Digital</span>
        <h1>Admin sign in</h1>
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
    const onChange = () => { setResource(activeModule()); setError(''); };
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

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">Lumarq Digital</div>
        <nav aria-label="Admin modules">
          {menu.map(item => (
            <a key={item} href={'#' + item} aria-current={item === resource ? 'page' : undefined}>{item === 'profile' ? 'Profile' : modules[item].title}</a>
          ))}
        </nav>
        <a className="admin-site-link" href="/">View website</a>
      </aside>
      <main className="admin-main">
        <div className="admin-account"><span>{account.displayName || account.email}</span><button className="admin-secondary" onClick={signOut}>Sign out</button></div>
        {error && <p role="alert" className="admin-error">{error}</p>}
        {resource === 'profile' ? <Profile account={account} onSaved={accountSaved} onExpired={onExpired} />
          : modules[resource].single
          ? <SingleContent key={resource} resource={resource} onExpired={onExpired} />
          : <DataTable key={resource} resource={resource} onExpired={onExpired} />}
      </main>
    </div>
  );
}
