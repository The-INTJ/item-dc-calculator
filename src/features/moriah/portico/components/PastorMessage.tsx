import { pastorPage } from '../content';
import { Inscription } from './Inscription';
import styles from './PastorMessage.module.scss';
import room from './Room.module.scss';

/** One of the two "bookends", drawn as a pilaster with its cap and base. */
function Bookend({ text, reference }: { text: string; reference: string }) {
  return (
    <figure className={styles.pilaster}>
      <span className={styles.cap} aria-hidden="true" />
      <div className={styles.shaft}>
        <p>{text}</p>
        <figcaption className={styles.reference}>{reference}</figcaption>
      </div>
      <span className={styles.base} aria-hidden="true" />
    </figure>
  );
}

/**
 * "The Message", verbatim. Elder Bryson calls Matthew 1:21 and John 19:30 the
 * "bookends" of the doctrine, so they are set as two pilasters, and they stand
 * on his next sentence: "The promise of saving is complete."
 */
export function PastorMessage() {
  const { message } = pastorPage;

  return (
    <section className={room.room} aria-labelledby="mo2-message-page">
      <Inscription id="mo2-message-page">{message.title}</Inscription>
      <p className={room.quiet}>{message.lead}</p>
      <p className={room.big}>{message.statement}</p>

      <p className={styles.bookendsLead}>{message.bookends}</p>
      <div className={styles.bookends}>
        <Bookend text={message.first.text} reference={message.first.ref} />
        <Bookend text={message.last.text} reference={message.last.ref} />
        <p className={styles.plinth}>{message.complete}</p>
      </div>

      <div className={room.prose}>
        <p>{message.backdrop}</p>
        <p>{message.chroniclesLead}</p>
      </div>
      <blockquote className={styles.chronicles}>
        <p>{message.chronicles}</p>
      </blockquote>
      <div className={room.prose}>
        <p>{message.rest}</p>
      </div>
      <p className={room.statement}>{message.close}</p>
    </section>
  );
}
