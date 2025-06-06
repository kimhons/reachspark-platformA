import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';

// Types
export interface AuthUser extends User {}
export interface AuthCredential extends UserCredential {}

export interface AuthService {
  currentUser: AuthUser | null;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthCredential>;
  signIn: (email: string, password: string) => Promise<AuthCredential>;
  signInWithGoogle: () => Promise<AuthCredential>;
  signInWithGithub: () => Promise<AuthCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (user: AuthUser, profile: { displayName?: string; photoURL?: string }) => Promise<void>;
  onUserChanged: (callback: (user: AuthUser | null) => void) => () => void;
}

export class FirebaseAuthService implements AuthService {
  private auth;
  private googleProvider;
  private githubProvider;
  
  constructor(firebaseConfig: any) {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    this.googleProvider = new GoogleAuthProvider();
    this.githubProvider = new GithubAuthProvider();
  }
  
  get currentUser(): AuthUser | null {
    return this.auth.currentUser;
  }
  
  async signUp(email: string, password: string, displayName: string): Promise<AuthCredential> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(credential.user, { displayName });
    return credential;
  }
  
  async signIn(email: string, password: string): Promise<AuthCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
  
  async signInWithGoogle(): Promise<AuthCredential> {
    return signInWithPopup(this.auth, this.googleProvider);
  }
  
  async signInWithGithub(): Promise<AuthCredential> {
    return signInWithPopup(this.auth, this.githubProvider);
  }
  
  async logout(): Promise<void> {
    return signOut(this.auth);
  }
  
  async resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }
  
  async updateUserProfile(user: AuthUser, profile: { displayName?: string; photoURL?: string }): Promise<void> {
    return updateProfile(user, profile);
  }
  
  onUserChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }
}

// Factory function to create auth service
export function createAuthService(firebaseConfig: any): AuthService {
  return new FirebaseAuthService(firebaseConfig);
}

export default createAuthService;
