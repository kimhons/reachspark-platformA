import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  CollectionReference,
  Query,
  QueryConstraint,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Types
export interface DatabaseService {
  // Collection operations
  getCollection: <T = DocumentData>(path: string) => CollectionReference<T>;
  query: <T = DocumentData>(collectionRef: CollectionReference<T>, ...queryConstraints: QueryConstraint[]) => Query<T>;
  getDocuments: <T = DocumentData>(query: Query<T>) => Promise<Array<QueryDocumentSnapshot<T>>>;
  addDocument: <T = DocumentData>(collectionRef: CollectionReference<T>, data: T) => Promise<DocumentReference<T>>;
  
  // Document operations
  getDocument: <T = DocumentData>(docRef: DocumentReference<T>) => Promise<T | null>;
  setDocument: <T = DocumentData>(docRef: DocumentReference<T>, data: T, merge?: boolean) => Promise<void>;
  updateDocument: <T = DocumentData>(docRef: DocumentReference<T>, data: Partial<T>) => Promise<void>;
  deleteDocument: (docRef: DocumentReference<unknown>) => Promise<void>;
  
  // Utility functions
  createRef: <T = DocumentData>(collectionPath: string, docId?: string) => DocumentReference<T>;
  createTimestamp: () => Timestamp;
  serverTimestamp: () => any;
}

export class FirestoreDatabaseService implements DatabaseService {
  private db;
  
  constructor(firebaseConfig: any) {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }
  
  // Collection operations
  getCollection<T = DocumentData>(path: string): CollectionReference<T> {
    return collection(this.db, path) as CollectionReference<T>;
  }
  
  query<T = DocumentData>(collectionRef: CollectionReference<T>, ...queryConstraints: QueryConstraint[]): Query<T> {
    return query(collectionRef, ...queryConstraints);
  }
  
  async getDocuments<T = DocumentData>(query: Query<T>): Promise<Array<QueryDocumentSnapshot<T>>> {
    const snapshot = await getDocs(query);
    return snapshot.docs;
  }
  
  async addDocument<T = DocumentData>(collectionRef: CollectionReference<T>, data: T): Promise<DocumentReference<T>> {
    return addDoc(collectionRef, data);
  }
  
  // Document operations
  async getDocument<T = DocumentData>(docRef: DocumentReference<T>): Promise<T | null> {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }
  
  async setDocument<T = DocumentData>(docRef: DocumentReference<T>, data: T, merge = false): Promise<void> {
    return setDoc(docRef, data, { merge });
  }
  
  async updateDocument<T = DocumentData>(docRef: DocumentReference<T>, data: Partial<T>): Promise<void> {
    return updateDoc(docRef, data as any);
  }
  
  async deleteDocument(docRef: DocumentReference<unknown>): Promise<void> {
    return deleteDoc(docRef);
  }
  
  // Utility functions
  createRef<T = DocumentData>(collectionPath: string, docId?: string): DocumentReference<T> {
    if (docId) {
      return doc(this.db, collectionPath, docId) as DocumentReference<T>;
    }
    return doc(collection(this.db, collectionPath)) as DocumentReference<T>;
  }
  
  createTimestamp(): Timestamp {
    return Timestamp.now();
  }
  
  serverTimestamp(): any {
    return serverTimestamp();
  }
}

// Export query constraints for easier usage
export { where, orderBy, limit, startAfter, Timestamp };

// Factory function to create database service
export function createDatabaseService(firebaseConfig: any): DatabaseService {
  return new FirestoreDatabaseService(firebaseConfig);
}

export default createDatabaseService;
