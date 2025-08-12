
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// List of admin email addresses
const ADMIN_EMAILS = [
  'admin@mallex.app',
  'moderator@mallex.app',
  // Add more admin emails as needed
];

export async function isEmailAdmin(email: string | null): Promise<boolean> {
  if (!email) return false;
  
  // Check hardcoded admin list first
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true;
  }

  // Optionally check Firestore for dynamic admin list
  try {
    const adminDoc = await getDoc(doc(db, 'admin', 'config'));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      if (data?.adminEmails && Array.isArray(data.adminEmails)) {
        return data.adminEmails.includes(email.toLowerCase());
      }
    }
  } catch (error) {
    console.warn('Could not check admin status from Firestore:', error);
  }

  return false;
}

export async function checkAdminStatus(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData?.isAdmin === true;
    }
  } catch (error) {
    console.warn('Could not check admin status:', error);
  }
  return false;
}
