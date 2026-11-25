import initial from '../initialContent.json';
import { useEffect, useRef, useState } from 'react';

export default function Contact({ settings, services }) {
  const options = services.filter(service => service.formLabel).map(service => {
    const original = initial.services.find(item => item._id === service._id && item.name === service.name);
    return { value: original?.formValue || service.name, label: service.formLabel, key: original?.slug || service._id };
  });
  if (!options.some(option => option.value === "Other")) options.push({ value: "Other", label: "Other", key: "other" });
  const [errors, setErrors] = useState({});
  const [submission, setSubmission] = useState(null);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const formRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (submission) successRef.current.focus({ preventScroll: true });
  }, [submission]);

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

  function validate(form, values, focus = false) {
    const next = {
      name: values.name.length < 2 ? 'Please enter your name.' : '',
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)
        ? 'Please enter a valid email address.' : '',
      service: !values.service ? 'Please choose a service.' : '',
      message: values.message.length < 10 ? 'Please add a few more details (10+ characters).' : '',
    };
    setErrors(next);
    const invalid = ['name', 'email', 'message', 'service'].find(field => next[field]);
    if (focus && invalid) form.querySelector('[name="' + invalid + '"]').focus();
    return !invalid;
  }

  function handleBlur(event) {
    if (['name', 'email', 'message'].includes(event.target.name) && event.target.value) {
      validate(event.currentTarget, readForm(event.currentTarget));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setNotice('');
    const form = event.currentTarget;
    const values = readForm(form);
    if (!validate(form, values, true) || values.company_site) return;

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
      setNotice('Something went wrong sending your request. Please try again.' + (settings.email ? ' You can also email ' + settings.email + '.' : ''));
    } finally {
      setPending(false);
    }
  }

  function resetForm() {
    formRef.current.reset();
    setErrors({});
    setSubmission(null);
    requestAnimationFrame(() => formRef.current?.elements.name.focus());
  }

  return (
    <section className="sec" id="contact" aria-labelledby="contact-title" data-testid="contact-section">
      <div className="wrap contact-grid">
        <div>
          <div data-reveal="">
            <span className="eyebrow">05 — Let’s talk</span>
            <h2 className="contact-big" id="contact-title">{settings.contactTitle} <em>{settings.contactEmphasis}</em></h2>
            <p className="lede">{settings.contactIntro}</p>
          </div>
          <ul className="perks" data-reveal="" data-delay=".1">
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7"/></svg>30-minute call with a senior engineer, not a salesperson</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7"/></svg>Written roadmap and estimate you can keep</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7"/></svg>NDA available on request</li>
          </ul>
          <div className="direct" data-reveal="" data-delay=".15">
            <span style={{"color":"var(--text-2)","fontSize":".85rem"}}>Prefer email?</span>
            {settings.email && <a href={"mailto:" + settings.email} data-testid="contact-email-link">{settings.email}</a>}
          </div>
        </div>
    
        <div className="form-card" data-reveal="" data-delay=".1">
          <form ref={formRef} onSubmit={handleSubmit} onBlur={handleBlur} hidden={Boolean(submission)} id="lead-form" noValidate aria-describedby="privacy-note" data-testid="consultation-form">
            <div className="row2">
              <div className="field"><label htmlFor="f-name">Full name</label><input id="f-name" name="name" autoComplete="name" placeholder="Jane Cooper" required aria-describedby="e-name" aria-invalid={Boolean(errors.name)} data-testid="form-name-input"/><span className="err" id="e-name" role="alert">{errors.name}</span></div>
              <div className="field"><label htmlFor="f-email">Work email</label><input id="f-email" name="email" type="email" autoComplete="email" placeholder="jane@company.com" required aria-describedby="e-email" aria-invalid={Boolean(errors.email)} data-testid="form-email-input"/><span className="err" id="e-email" role="alert">{errors.email}</span></div>
            </div>
            <fieldset className="field pills" aria-describedby="e-service" data-testid="form-service-group">
              <legend>What do you need?</legend>
              {options.map(option => <label key={option.key}>
                <input type="radio" name="service" value={option.value} data-testid={"service-option-" + option.key} />
                <span>{option.label}</span>
              </label>)}
              <span className="err" id="e-service" role="alert" style={{"width":"100%"}}>{errors.service}</span>
            </fieldset>
            <div className="field"><label htmlFor="f-budget">Estimated budget <span className="opt">(optional)</span></label>
              <select id="f-budget" name="budget" data-testid="form-budget-select"><option value="">Select a range</option><option>Under $5k</option><option>$5k – $15k</option><option>$15k – $50k</option><option>$50k+</option><option>Not sure yet</option></select>
            </div>
            <div className="field"><label htmlFor="f-msg">Project details</label><textarea id="f-msg" name="message" placeholder="A few lines about your goals, timeline and anything already built." required aria-describedby="e-msg" aria-invalid={Boolean(errors.message)} data-testid="form-message-input"></textarea><span className="err" id="e-msg" role="alert">{errors.message}</span></div>
            <input className="hp" type="text" name="company_site" tabIndex="-1" autoComplete="off" aria-hidden="true"/>
            <div className="form-foot">
              <button type="submit" className={pending ? "btn btn-primary loading" : "btn btn-primary"} disabled={pending} id="f-submit" data-testid="form-submit-button"><span className="spin" aria-hidden="true"></span>Request free consultation <span className="arr" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6h10M6 1l5 5-5 5"/></svg></span></button>
            </div>
            <p className="form-alert" id="form-alert" role="alert" data-testid="form-error">{notice}</p>
            <p className="privacy" id="privacy-note" data-testid="privacy-disclaimer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>We respect your privacy. Your details are used only to reply to this enquiry — never sold or shared with third parties. You can ask us to delete them at any time.</p>
          </form>
          <div className="success" id="success" hidden={!submission} data-testid="form-success">
            <div className="tick" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12l5 5L20 7"/></svg></div>
            <h3 tabIndex="-1" id="success-title" ref={successRef}>Thanks, <span id="s-name">{submission?.name.split(" ")[0] || "there"}</span> — we’re on it.</h3>
            <p>Your request is in. A senior engineer will reply to <b id="s-email" style={{"color":"var(--text)"}}>{submission?.email}</b> within one business day with next steps.</p>
            <button type="button" className="btn btn-ghost" id="again" onClick={resetForm} data-testid="form-send-another">Send another request</button>
          </div>
        </div>
      </div>
    </section>
  );
}
