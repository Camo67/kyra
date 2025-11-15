import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

function assertConfig() {
  const missing = Object.entries(firebaseAdminConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing Firebase admin env vars: ${missing.join(", ")}`);
  }
}

export function getFirebaseAdminApp() {
  if (!getApps().length) {
    assertConfig();
    initializeApp({
      credential: cert(firebaseAdminConfig),
    });
  }
  return getApps()[0];
}

export function getServerDb() {
  return getFirestore(getFirebaseAdminApp());
}
