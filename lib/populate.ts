import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export default async function populateDataLogic(userId: string) {
    //function for adding example training logs
    async function populateTrainingLogs() {
        //making sure that the example data doesn't collide with itself
        //use this id for everything
        const base = Date.now();
        let i = 0;
        const nextId = () => `${base}-${++i}`;

        //training log entry number 1
        await set(ref(db, `users/${userId}/sessions/${nextId}`), {
            title: 'No-gi open mat',
            date: '3/15/2026',
            duration: '1.5',
            notes: 'Worked passing and half-guard entries. Felt solid on top pressure.',
            qualityLevel: '8',
            tags: ['Guard Passes', 'Grips'],
            createdAt: new Date().toISOString(),
        });

        await set(ref(db, `users/${userId}/sessions/${nextId()}`), {
            title: 'Fundamentals and submissions',
            date: '3/19/2026',
            duration: '1',
            notes: 'Worked on fundamental movements again. Also worked on perfecting the rear-naked choke.',
            qualityLevel: '7',
            tags: ['Rear-Naked Chokes', 'Back Control', 'Chokes'],
            createdAt: new Date().toISOString(),
        });

        //same denormalized fields the training page updates after save
        await set(ref(db, `users/${userId}/sessionCount`), 2);
        await set(ref(db, `users/${userId}/records`), { maxHours: 1.5 });
        await set(ref(db, `users/${userId}/mostRecentDate`), { lastTrained: '3/19/2026' });
    }

    //matches dashboard listeners: each path is a number, not an object
    async function populateCompStats() {
        await set(ref(db, `users/${userId}/comp/wins`), 5);
        await set(ref(db, `users/${userId}/comp/losses`), 1);
        await set(ref(db, `users/${userId}/comp/submissionWins`), 3);
        await set(ref(db, `users/${userId}/comp/pointsWins`), 2);
        await set(ref(db, `users/${userId}/comp/submissionLosses`), 0);
        await set(ref(db, `users/${userId}/comp/pointsLosses`), 1);
    }

    //running all the functions
    await populateTrainingLogs();
    await populateCompStats();
}
