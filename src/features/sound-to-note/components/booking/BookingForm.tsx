'use client';

import { useState, type FormEvent } from 'react';

import { bookingTypes, contact, rates, teamSizes } from '../../content';
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
        label="Shoot dates"
        placeholder="Mar 3–7, 6am calls"
        required
        {...bind('dates')}
      />
      <TextField
        label="Filming location(s)"
        placeholder="Atlanta, GA + one day in Savannah"
        required
        {...bind('location')}
      />
      <SelectField label="Project type" options={bookingTypes} required {...bind('type')} />
      <SelectField label="Sound team" options={teamSizes} required {...bind('team')} />
      <SelectField label="Rate" options={rates} required {...bind('rate')} />
      <div className={f.spacer} />
      <div className={f.full}>
        <TextField
          label="About the project"
          multiline
          placeholder="Production, schedule, call times, special requirements: anything that helps me plan."
          {...bind('description')}
        />
      </div>
      <ServicesPicker picked={picked} onChange={setPicked} />
      <TextField label="Your name" required {...bind('name')} />
      <TextField label="Email" type="email" required {...bind('email')} />
      <TextField label="Phone (for texts)" type="tel" {...bind('phone')} />
      <div className={`${f.full} ${f.sendRow}`}>
        <Button size="lg" type="submit" icon={<Icon name="send" size={18} />}>
          Send to Alex
        </Button>
        <span className={f.aside}>
          Or email <a href={`mailto:${contact.email}`}>{contact.email}</a> · DM{' '}
          <a href={contact.instagramHref} target="_blank" rel="noreferrer">
            {contact.instagram}
          </a>
        </span>
      </div>
    </form>
  );
}
