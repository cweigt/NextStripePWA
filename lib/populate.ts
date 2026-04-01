import { db } from '@/lib/firebase';
import { generateRecurring } from '@/lib/generateRecurring';
import { ref, set } from 'firebase/database';

export default async function populateDataLogic(userId: string) {
    //function for adding example training logs
    async function populateTrainingLogs() {
        // Fixed IDs so `lib/remove.ts` can delete the same rows (see SEED.sessions).

        //training log entry number 1
        await set(ref(db, `users/${userId}/sessions/example-session-1`), {
            title: 'No-gi open mat',
            date: '3/15/2026',
            duration: '1.5',
            notes: 'Worked passing and half-guard entries. Felt solid on top pressure.',
            qualityLevel: '8',
            tags: ['Guard Passes', 'Grips'],
            createdAt: new Date().toISOString(),
        });

        await set(ref(db, `users/${userId}/sessions/example-session-2`), {
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

    //populating injury log
    async function populateInjuryLog() {
        //injury log #1
        await set(ref(db, `users/${userId}/injuries/example-injury-1`), {
            name: 'Torn ACL',
            bodyPart: 'Knee',
            cause: 'Competition',
            severity: 'Severe',
            status: 'Active',
            dateOfInjury: '2026-03-20', //YYYY-MM-DD 
            recoveryEndDate: '2026-09-04',
            recoveryAmount: '24',
            recoveryUnit: 'Weeks',
            doctor: 'Dr. Renafscus',
            notes: `My leg got caught under me and somehow my ACL was torn when the opponent landed on me.`,
            createdAt: new Date().toISOString(),
        });

        //injury log #2
        await set(ref(db, `users/${userId}/injuries/example-injury-2`), {
            name: 'Neck tension',
            bodyPart: 'Neck',
            cause: 'Sparring',
            severity: 'Moderate',
            status: 'Recovered',
            dateOfInjury: '2026-02-27', //YYYY-MM-DD 
            recoveryEndDate: '2026-03-27',
            recoveryAmount: '4',
            recoveryUnit: 'Weeks',
            doctor: 'Dr. Jackson',
            notes: `I was doing some slow-paced sparring, and I got neck cranked a little bit too hard. Been experiencing tension, pain, and discomfort on my neck when looking to the right.`,
            createdAt: new Date().toISOString(),
        });
    }

    //function for populating the schedule events
    async function populateSchedule(){
        //first entry — recurring weekly for 4 weeks (fixed IDs so remove.ts can clean them up)
        const start1 = new Date('2026-03-25T18:30:00');
        const end1   = new Date('2026-04-15T18:30:00');
        const instances1 = generateRecurring('Open mat', start1, 'weekly', end1);
        const recurringIds = ['example-event-1', 'example-event-1-w2', 'example-event-1-w3', 'example-event-1-w4'];
        for (let i = 0; i < instances1.length; i++) {
            const inst = instances1[i];
            await set(ref(db, `users/${userId}/schedule/${inst.dateKey}/${recurringIds[i]}`), inst.payload);
        }

        //second entry — one-off
        const day2 = '2026-03-28';
        const start2 = new Date(`${day2}T10:00:00`);
        await set(ref(db, `users/${userId}/schedule/${day2}/example-event-2`), {
            title: 'Comp class',
            startISO: start2.toISOString(),
            createdAt: new Date().toISOString(),
            recurring: false,
            recurrenceType: 'none',
        });
    }

    //function for populating videos
    async function populateVideos() {
        //first video
        await set(ref(db, `users/${userId}/library/videos/example-video-1`), {
            title: 'Armbar from side control',
            description: 'We learned the armbar from side control and back control today.',
            difficulty: 'intermediate',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            createdAt: new Date().toISOString(),
        });

        //second video
        await set(ref(db, `users/${userId}/library/videos/example-video-2`), {
            title: 'Back take from turtle',
            description: 'Drilling the back take when the opponent turtles up. Focus on seat belt grip and hook placement.',
            difficulty: 'advanced',
            videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            createdAt: new Date().toISOString(),
        });
    }

    await populateTrainingLogs();
    await populateCompStats();
    await populateInjuryLog();
    await populateSchedule();
    await populateVideos();
}
