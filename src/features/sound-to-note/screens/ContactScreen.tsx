import { BookingForm } from '../components/booking/BookingForm';
import { SectionHeader } from '../components/ui/primitives';
import f from '../styles/form.module.scss';

/** `&service=` (comma-separated slugs) pre-checks services, e.g. from the Links page. */
export function ContactScreen({ services }: { services: string[] }) {
  return (
    <div className={f.page}>
      <SectionHeader
        eyebrow="Booking"
        title="Let's make it sound good"
        lead="Fill in what you know. It opens an email to me with everything filled in, and I'll get back to you fast."
      />
      <BookingForm key={services.join()} initialServices={services} />
    </div>
  );
}
