'use client';

import { useRef, useState, type FormEvent } from 'react';

export default function DemoContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const requestId = useRef('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    requestId.current ||= crypto.randomUUID();
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, requestId: requestId.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Please try again.');
      setStatus('sent');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not send your request. Please try again.');
      setStatus('error');
      requestId.current = '';
    }
  }

  return <section className="section contact-section" id="contact" aria-labelledby="contact-title">
    <div><div className="eyebrow">Let’s talk about your next move</div><h2 id="contact-title">See what LotScout<br />can do for your team.</h2><p>Tell us about your company and the markets you care about. We’ll get in touch to discuss your needs and arrange a demo.</p><p className="micro">Submitting this form requests a conversation. It does not book a time or create an account.</p></div>
    {status === 'sent' ? <div className="contact-success" role="status"><h3>Thanks, your request is in. We’ll be in touch.</h3></div> : <form className="demo-form" onSubmit={submit} aria-busy={status === 'sending'}>
      <fieldset disabled={status === 'sending'}>
        <legend className="micro">All fields marked * are required.</legend>
        <div className="contact-fields">
          {[
            ['firstName', 'First Name', 'text', 'given-name'],
            ['lastName', 'Last Name', 'text', 'family-name'],
            ['email', 'Email', 'email', 'email'],
            ['phone', 'Phone', 'tel', 'tel'],
            ['company', 'Company', 'text', 'organization'],
            ['jobTitle', 'Job Title / Type', 'text', 'organization-title'],
          ].map(([name, label, type, autoComplete]) => <label key={name} htmlFor={'demo-' + name}>{label} *<input id={'demo-' + name} name={name} type={type} autoComplete={autoComplete} maxLength={200} required /></label>)}
          <label htmlFor="demo-industry">Industry *<select id="demo-industry" name="industry" required defaultValue=""><option value="" disabled>Select Your Industry</option>{['Homebuilding', 'Land Development', 'Real Estate Brokerage', 'Investment / Build-To-Rent', 'Banking / Lending', 'Economic Development', 'Government / Utilities', 'Other'].map(value => <option key={value}>{value}</option>)}</select></label>
          <label htmlFor="demo-market">State / Market *<input id="demo-market" name="market" maxLength={200} placeholder="State, city, or region" required /></label>
          <label className="full-field" htmlFor="demo-interest">I’m Interested In *<select id="demo-interest" name="interest" required defaultValue=""><option value="" disabled>Select Your Interest</option>{['LotScout Platform Demo', 'Scout AI Demo', 'Land & Development Intelligence', 'Economic Heat Maps', 'Company / Division Reporting', 'Other'].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="full-field" htmlFor="demo-message">What Would You Like To Know?<textarea id="demo-message" name="message" maxLength={2000} rows={3} /></label>
        </div>
        <div className="contact-trap" aria-hidden="true"><label>Leave This Empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="contact-consent"><input type="checkbox" name="consent" required /> <span>I agree to the <a href="/#terms">Terms</a> and <a href="/#privacy">Privacy Policy</a> and allow LotScout to contact me about this request.</span></label>
        {error && <p role="alert">{error}</p>}
        <button className="button" type="submit">{status === 'sending' ? 'Sending Request…' : 'Request My Demo'}</button>
      </fieldset>
    </form>}
  </section>;
}
