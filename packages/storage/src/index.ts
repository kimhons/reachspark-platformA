import { initializeApp } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  list,
  StorageReference,
  UploadResult,
  UploadMetadata,
  ListResult,
  ListOptions
} from 'firebase/storage';

// Types
export interface StorageService {
  // Upload operations
  uploadFile: (path: string, file: File | Blob, metadata?: UploadMetadata) => Promise<UploadResult>;
  uploadBase64: (path: string, dataUrl: string, metadata?: UploadMetadata) => Promise<UploadResult>;
  
  // Download operations
  getDownloadUrl: (path: string) => Promise<string>;
  
  // Management operations
  deleteFile: (path: string) => Promise<void>;
  listFiles: (path: string, options?: ListOptions) => Promise<ListResult>;
  listAllFiles: (path: string) => Promise<ListResult>;
  
  // Utility functions
  createRef: (path: string) => StorageReference;
}

export class FirebaseStorageService implements StorageService {
  private storage;
  
  constructor(firebaseConfig: any) {
    const app = initializeApp(firebaseConfig);
    this.storage = getStorage(app);
  }
  
  // Upload operations
  async uploadFile(path: string, file: File | Blob, metadata?: UploadMetadata): Promise<UploadResult> {
    const storageRef = ref(this.storage, path);
    return uploadBytes(storageRef, file, metadata);
  }
  
  async uploadBase64(path: string, dataUrl: string, metadata?: UploadMetadata): Promise<UploadResult> {
    const storageRef = ref(this.storage, path);
    return uploadString(storageRef, dataUrl, 'data_url', metadata);
  }
  
  // Download operations
  async getDownloadUrl(path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    return getDownloadURL(storageRef);
  }
  
  // Management operations
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(this.storage, path);
    return deleteObject(storageRef);
  }
  
  async listFiles(path: string, options?: ListOptions): Promise<ListResult> {
    const storageRef = ref(this.storage, path);
    return list(storageRef, options);
  }
  
  async listAllFiles(path: string): Promise<ListResult> {
    const storageRef = ref(this.storage, path);
    return listAll(storageRef);
  }
  
  // Utility functions
  createRef(path: string): StorageReference {
    return ref(this.storage, path);
  }
}

// Factory function to create storage service
export function createStorageService(firebaseConfig: any): StorageService {
  return new FirebaseStorageService(firebaseConfig);
}

export default createStorageService;
