import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

export async function POST(request: Request) {
  const { uid, secret } = await request.json();

  // CHECK THE PASSWORD HERE
  if (secret !== process.env.ADMIN_SECRET_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { developer: true });
    return NextResponse.json({ message: `Success for ${uid}` });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}