import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCZ3HCYBzB2euSAg1JpGhuhk_1AsLFYm7Q",
  authDomain: "circl0th.firebaseapp.com",
  projectId: "circl0th",
  storageBucket: "circl0th.firebasestorage.app",
  messagingSenderId: "9014370275",
  appId: "1:9014370275:web:cb461bedb8b15bc9d28ad6",
  measurementId: "G-WGC6FPSW4P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
// Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

export const signIn = async ({ name }) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      name,
      email: user.email
    }, { merge: true });

    return { ...user, name };
  } catch (err) {
    console.error("Error signing in or saving user:", err);
    throw err;
  }
};


// export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);


export { db, storage };
