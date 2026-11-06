import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const connectGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('نەتوانرا Access Token لە Google وەربگیرێت');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const disconnectGoogleDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Check if a backup file already exists on Drive created by this app
async function findExistingBackupFile(accessToken: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name = 'sarvan_qist_mobile_backup.json' and trashed = false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch {
    return null;
  }
}

// Automatically upload or update the backup file in user's Google Drive
export const uploadBackupToGoogleDrive = async (
  fullDatabase: any,
  accessToken?: string
): Promise<{ success: boolean; fileId?: string; error?: string }> => {
  const token = accessToken || cachedAccessToken;
  if (!token) {
    return { success: false, error: 'Google Drive بەستراو نییە' };
  }

  try {
    const existingFileId = await findExistingBackupFile(token);
    const content = JSON.stringify(fullDatabase, null, 2);

    if (existingFileId) {
      // Update existing file content
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: content,
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        return { success: false, error: errText };
      }

      return { success: true, fileId: existingFileId };
    } else {
      // Create new file with multipart upload (metadata + media)
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const metadata = {
        name: 'sarvan_qist_mobile_backup.json',
        mimeType: 'application/json',
        description: 'باکئەپی ئۆتۆماتیکی سیستەمی قیستی مۆبایل و گرێبەستەکان',
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        closeDelim;

      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!createRes.ok) {
        const errText = await createRes.text();
        return { success: false, error: errText };
      }

      const createdFile = await createRes.json();
      return { success: true, fileId: createdFile.id };
    }
  } catch (err: any) {
    console.error('Google Drive sync error:', err);
    return { success: false, error: err.message || 'هەڵە لە پەیوەندی کردن بە گووگڵ درایڤ' };
  }
};

// Read backup file directly from Google Drive
export const downloadBackupFromGoogleDrive = async (
  accessToken?: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = accessToken || cachedAccessToken;
  if (!token) {
    return { success: false, error: 'Google Drive بەستراو نییە' };
  }

  try {
    const fileId = await findExistingBackupFile(token);
    if (!fileId) {
      return { success: false, error: 'هیچ فایلی باکئەپێک لەسەر گووگڵ درایڤەکەت نەدۆزرایەوە' };
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { success: false, error: 'نەتوانرا فایلی باکئەپ بخوێندرێتەوە' };
    }

    const json = await res.json();
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'هەڵە لە هێنانی داتاکان لە گووگڵ درایڤ' };
  }
};
