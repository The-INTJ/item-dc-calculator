'use client';
import { useContestStore } from "@/contest/contexts/contest/ContestContext";
import styles from './ListOfContests.module.scss';

export default function ListOfContests() {
    const { contests } = useContestStore();
    
    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Contests</h2>
            <ul className={styles.list}>
                {contests.map((contest) => (
                    <li key={contest.id} className={styles.item}>
                        <span className={styles.contestName}>{contest.name}</span>
                        <span 
                            className={styles.phaseBadge} 
                            data-phase={contest.phase}
                        >
                            {contest.phase}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}