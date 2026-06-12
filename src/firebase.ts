import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Firestore database with potential Multi-Database configuration reference
export const db = getFirestore(app);

// Export Firebase Authentication instance
export const auth = getAuth();

// Test the Connection to Firestore (Validation step required by Firestore skill guidelines)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test_connection_path", "test_id"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("[MARELLI Database] Client appears offline or Firebase config needs initialization.");
    }
  }
}
testConnection();

// Define Error Types
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * Robust centralized Firebase error handler that logs structured information.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error("[MARELLI Database Error]", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
