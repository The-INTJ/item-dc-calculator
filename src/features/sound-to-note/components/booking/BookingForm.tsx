'use client';

import { useState, type FormEvent } from 'react';

import { contact, rates } from '../../content';
import f from '../../styles/form.module.scss';
import typo from '../../styles/type.module.scss';
import { Button } from '../ui/Button';
import { Icon } from '../ui/primitives';
import { emptyInquiry, inquiryMailto } from './booking-email';
import { SelectField, ServicesPicker, TextField } from './fields';

function Sent({ mailto, onEdit }: { mailto: string; onEdit: () => void }) {
  return (
    <div className={f.sent} role="status">
      <span className={typo.label} style={{ color: 'var(--accent-secondary-text)' }}>
        ● Inquiry ready
      </span>
      <h2 className={typo.cardTitle}>Check your email app</h2>
      <p>
        It should have opened with everything filled in. Hit send and I&apos;ll get back to you
        fast.
      </p>
      <div className={f.sendRow}>
        <Button href={mailto} variant="secondary">
          Open it again
        </Button>
        <Button variant="ghost" onClick={onEdit}>
          Edit the details
        </Button>
      </div>
    </div>
  );
}

/** Booking inquiry → prefilled email. Browser validation guards the required fields. */
export function BookingForm({ initialServices }: { initialServices: string[] }) {
  const [values, setValues] = useState(emptyInquiry);
  const [picked, setPicked] = useState<string[]>(initialServices);
  const [sent, setSent] = useState(false);
  const mailto = inquiryMailto({ ...values, services: picked });

  const bind = (key: keyof typeof emptyInquiry) => ({
    name: key,
    value: values[key],
    onChange: (value: string) => setValues({ ...values, [key]: value }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    window.location.href = mailto;
    setSent(true);
  }

  if (sent) return <Sent mailto={mailto} onEdit={() => setSent(false)} />;

  return (
    <form onSubmit={submit} className={f.grid}>
      <TextField
        label="Filming location(s)"
        placeholder="Atlanta, GA + one day in Savannah"
        required
        {...bind('location')}
      />
      <TextField
        label="Dates / times"
        placeholder="Mar 3–7, 6am calls"
        required
        {...bind('dates')}
      />
      <SelectField label="Rate" options={rates} {...bind('rate')} />
      <div className={f.spacer} />
      <div className={f.full}>
        <TextField
          label="About the project"
          multiline
          placeholder="Feature, commercial, doc? How big is the crew? Anything tricky (rain, boats, 40 extras)?"
          required
          {...bind('description')}
        />
      </div>
      <ServicesPicker picked={picked} onChange={setPicked} />
      <TextField label="Your name" required {...bind('name')} />
      <TextField label="Email" type="email" required {...bind('email')} />
      <TextField label="Phone" type="tel" {...bind('phone')} />
      <div className={`${f.full} ${f.sendRow}`}>
        <Button size="lg" type="submit" icon={<Icon name="send" size={18} />}>
          Send to Alex
        </Button>
        <span className={f.aside}>
          Or email <a href={`mailto:${contact.email}`}>{contact.email}</a> · call{' '}
          <a href={contact.phoneHref}>{contact.phone}</a>
        </span>
      </div>
    </form>
  );
}
