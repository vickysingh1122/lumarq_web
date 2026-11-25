import { useState } from 'react';
import { adminRequest } from './api.js';

function AccountForm({ changePassword = false, account, onSaved, onExpired }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const prefix = changePassword ? 'password' : 'profile';
  const title = changePassword ? 'Change password' : 'Account details';

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const { confirmPassword, ...body } = fields;
    setFeedback('');
    setError('');
    if (changePassword && body.newPassword !== confirmPassword) {
      setError('The new passwords must match.');
      return;
    }
    setBusy(true);
    try {
      const result = await adminRequest(prefix, { method: 'PUT', body });
      form.elements.currentPassword.value = '';
      onSaved(result, changePassword);
      setFeedback('Profile saved.');
    } catch (failure) {
      if (failure.status === 401) onExpired();
      else setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" aria-labelledby={prefix + '-title'}>
      <form className="admin-form" onSubmit={submit}>
        <h2 id={prefix + '-title'}>{title}</h2>
        <fieldset className="admin-fields" disabled={busy}>
          {!changePassword && <>
            <div className="admin-field"><label htmlFor="profile-name">Display name</label>
              <input name="displayName" id="profile-name" defaultValue={account.displayName} autoComplete="name" maxLength={100} /></div>
            <div className="admin-field"><label htmlFor="profile-email">Sign-in email</label>
              <input name="email" id="profile-email" type="email" defaultValue={account.email} autoComplete="username" required maxLength={254} /></div>
          </>}
          <div className="admin-field"><label htmlFor={prefix + '-current'}>Current password</label>
            <input id={prefix + '-current'} name="currentPassword" type="password" autoComplete="current-password" required maxLength={256} /></div>
          {changePassword && <>
            <div className="admin-field"><label htmlFor="password-new">New password (at least 14 characters)</label>
              <input id="password-new" name="newPassword" type="password" autoComplete="new-password" required minLength={14} maxLength={256} /></div>
            <div className="admin-field"><label htmlFor="password-confirm">Confirm new password</label>
              <input id="password-confirm" name="confirmPassword" type="password" autoComplete="new-password" required minLength={14} maxLength={256} /></div>
          </>}
        </fieldset>
        {error && <p role="alert" className="admin-error">{error}</p>}
        {feedback && <p role="status" className="admin-feedback">{feedback}</p>}
        <div className="admin-form-actions">
          <button className="admin-primary" disabled={busy}>{busy ? 'Saving...' : changePassword ? 'Update password' : 'Save profile'}</button>
        </div>
      </form>
    </section>
  );
}

export default function Profile({ account, onSaved, onExpired }) {
  return (
    <>
      <h1 className="admin-section-title">Profile</h1>
      <div className="admin-profile">
        <AccountForm account={account} onSaved={onSaved} onExpired={onExpired} />
        <AccountForm changePassword account={account} onSaved={onSaved} onExpired={onExpired} />
      </div>
    </>
  );
}
