import initial from '../initialContent.json';
import { useEffect, useRef, useState } from 'react';

function errorsFor(values) {
  return {
    name: values.name.length < 2 ? 'Please enter your name.' : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email) ? 'Please enter a valid email address.' : '',
    service: !values.service ? 'Please choose a service.' : '',
    message: values.message.length < 10 ? 'Please add a few more details (at least 10 characters).' : '',
  };
}

function readForm(form) {
  const fields = new FormData(form);
  return {
    name: fields.get('name').trim(),
    email: fields.get('email').trim(),
    service: fields.get('service'),
    budget: fields.get('budget') || null,
    message: fields.get('message').trim(),
    company_site: fields.get('company_site'),
  };
}

export default function Contact({ settings, services, preferredService }) {
  const options = services.filter(service => service.formLabel).map(service => {
    const original = initial.services.find(item => item._id === service._id && item.name === service.name);
    return { value: original?.formValue || service.name, label: service.formLabel, key: service._id, slug: original?.slug || service._id };
  });
  if (!options.some(option => option.value === 'Other')) {
    options.push({ value: 'Other', label: 'Other', key: 'other', slug: 'other' });
  }

  const [selection, setSelection] = useState(null);
  const [errors, setErrors] = useState({});
  const [submission, setSubmission] = useState(null);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const formRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (submission) successRef.current.focus({ preventScroll: true });
  }, [submission]);

  function handleChange(event) {
    const { name } = event.target;
    if (['name', 'email', 'message'].includes(name) && errors[name]) {
      const message = errorsFor(readForm(event.currentTarget))[name];
      setErrors(previous => ({ ...previous, [name]: message }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setNotice('');
    const form = event.currentTarget;
    const values = readForm(form);
    const nextErrors = errorsFor(values);
    setErrors(nextErrors);
    const invalid = Object.keys(nextErrors).find(field => nextErrors[field]);
    if (invalid) {
      form.querySelector('[name="' + invalid + '"]')?.focus();
      return;
    }
    if (values.company_site) return;

    setPending(true);
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (response.status !== 201) throw new Error('Submission failed');
      setSubmission(values);
    } catch {
      setNotice('Your enquiry could not be sent. Please try again.' + (settings.email ? ' You can also email ' + settings.email + '.' : ''));
    } finally {
      setPending(false);
    }
  }

  function resetForm() {
    formRef.current.reset();
    setSelection(null);
    setErrors({});
    setSubmission(null);
    requestAnimationFrame(() => formRef.current?.elements.name.focus());
  }

  return (
    <section className="section contact-section" id="contact" aria-labelledby="contact-title" data-testid="contact-section">
      <div className="wrap contact-grid">
        <div className="contact-copy">
          <p className="eyebrow">Project enquiries</p>
          <h1 id="contact-title">{settings.contactTitle} <em>{settings.contactEmphasis}</em></h1>
          <p className="lede">{settings.contactIntro}</p>
          <dl>
            <div><dt>What to send</dt><dd>Your goal, ideal timeline and a link to anything already built.</dd></div>
            <div><dt>What happens next</dt><dd>We’ll review your brief and follow up by email.</dd></div>
          </dl>
          {settings.email && <p>Prefer email? <a className="text-link" href={'mailto:' + settings.email}>{settings.email}</a></p>}
          {settings.phone && <p><a className="text-link" href={'tel:' + settings.phone}>{settings.phone}</a></p>}
        </div>
        <div className="form-card" id="lead-form">
          <form ref={formRef} onSubmit={handleSubmit} onChange={handleChange} hidden={Boolean(submission)} noValidate aria-describedby="privacy-note" data-testid="consultation-form">
            <h2>Request a free consultation</h2>
            <div className="row2">
              <div className="field">
                <label htmlFor="f-name">Full name</label>
                <input id="f-name" name="name" autoComplete="name" maxLength={200} required aria-describedby="e-name" aria-invalid={Boolean(errors.name)} data-testid="form-name-input" />
                <span className="err" id="e-name" role="alert">{errors.name}</span>
              </div>
              <div className="field">
                <label htmlFor="f-email">Email address</label>
                <input id="f-email" name="email" type="email" autoComplete="email" maxLength={254} required aria-describedby="e-email" aria-invalid={Boolean(errors.email)} data-testid="form-email-input" />
                <span className="err" id="e-email" role="alert">{errors.email}</span>
              </div>
            </div>
            <fieldset className="field pills" aria-describedby="e-service" data-testid="form-service-group">
              <legend>What do you need?</legend>
              {options.map(option => <label key={option.key}>
                <input type="radio" name="service" value={option.value} checked={(selection ?? preferredService) === option.key} onChange={() => {
                  setSelection(option.key);
                  setErrors(previous => ({ ...previous, service: '' }));
                }} required aria-invalid={Boolean(errors.service)} data-testid={'service-option-' + option.slug} />
                <span>{option.label}</span>
              </label>)}
              <span className="err" id="e-service" role="alert">{errors.service}</span>
            </fieldset>
            <div className="field">
              <label htmlFor="f-budget">Estimated budget <span className="opt">(optional)</span></label>
              <select id="f-budget" name="budget" data-testid="form-budget-select"><option value="">Select a range</option><option>Under $5k</option><option>$5k – $15k</option><option>$15k – $50k</option><option>$50k+</option><option>Not sure yet</option></select>
            </div>
            <div className="field">
              <label htmlFor="f-msg">Project details</label>
              <textarea id="f-msg" name="message" placeholder="What are you looking to build or improve?" maxLength={10000} required aria-describedby="e-msg" aria-invalid={Boolean(errors.message)} data-testid="form-message-input" />
              <span className="err" id="e-msg" role="alert">{errors.message}</span>
            </div>
            <input className="hp" type="text" name="company_site" tabIndex="-1" autoComplete="off" aria-hidden="true" />
            <button type="submit" className="btn btn-primary" disabled={pending} data-testid="form-submit-button">{pending ? 'Sending…' : 'Send my enquiry'}</button>
            <p className="form-alert" role="alert" data-testid="form-error">{notice}</p>
            <p className="privacy" id="privacy-note">We use your details to review your enquiry and follow up by email. <a href="/privacy">Read our privacy notice.</a></p>
          </form>
          <div className="success" hidden={!submission} data-testid="form-success">
            <h2 tabIndex="-1" ref={successRef}>Enquiry received.</h2>
            <p>Thanks, {submission?.name.split(/\s+/)[0]}. We’ll use <strong>{submission?.email}</strong> to follow up about your project.</p>
            <button type="button" className="btn btn-secondary" onClick={resetForm} data-testid="form-send-another">Send another enquiry</button>
          </div>
        </div>
      </div>
    </section>
  );
}
