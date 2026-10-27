import { BookingForm } from '../components/booking/BookingForm';
import { SectionHeader } from '../components/ui/primitives';
import f from '../styles/form.module.scss';

/** `&service=` (comma-separated slugs) pre-checks services, e.g. `?service=post`. */
export function ContactScreen({ services }: { services: string[] }) {
  return (
    <div className={f.page}>
      <SectionHeader
        eyebrow="Booking"
        title="Let's make it sound good"
        lead="Dates first, please: they're what I check before anything else. Sending this opens an email to me with your details filled in. Email or Instagram is the best way to reach me."
      />
      <BookingForm key={services.join()} initialServices={services} />
    </div>
  );
}
