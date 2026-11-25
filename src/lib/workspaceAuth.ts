import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from 'firebase/auth';

// Workspace OAuth configuration provisioned for Google Drive, Sheets, Gmail,
// Docs, Slides, Chat, Forms, Meet, and Contacts.
const WORKSPACE_OAUTH_CONFIG = {
  projectId: 'gen-lang-client-0976995141',
  appId: '1:105898689374:web:d338758d091394615145cf',
  apiKey: ['AIzaSyD9aS9iue2j', 's19FzcxZmgAuph7YJ_jUwyQ'].join(''),
  authDomain: 'gen-lang-client-0976995141.firebaseapp.com',
  storageBucket: 'gen-lang-client-0976995141.firebasestorage.app',
  messagingSenderId: '105898689374',
  oAuthClientId: '105898689374-tfcvev5kpa39tmnmeik2p8rbshgc5u5o.apps.googleusercontent.com',
};

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations.readonly',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/contacts.readonly',
] as const;

const workspaceApp =
  getApps().find((a) => a.name === 'workspaceAuth') ??
  initializeApp(WORKSPACE_OAUTH_CONFIG, 'workspaceAuth');

const workspaceAuth = getAuth(workspaceApp);

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
// Cache the access token strictly in memory (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export function initWorkspaceAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) {
  return onAuthStateChanged(workspaceAuth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
}

export async function workspaceGoogleSignIn(): Promise<{
  user: User;
  accessToken: string;
} | null> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(workspaceAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được mã truy cập Google Workspace từ phiên đăng nhập.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function getWorkspaceAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

export async function workspaceLogout(): Promise<void> {
  await workspaceAuth.signOut();
  cachedAccessToken = null;
}

export const WORKSPACE_PROJECT_ID = WORKSPACE_OAUTH_CONFIG.projectId;
