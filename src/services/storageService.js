import { appConfig } from '../config/appConfig';

// Firebase Storage imports are dynamic to avoid bundling when in mock mode
let firebaseStorage;
let firebaseRef;
let firebaseUploadBytes;
let firebaseUploadBytesResumable;
let firebaseGetDownloadURL;
let firebaseDeleteObject;
let firebaseListAll;
let firebaseGetMetadata;
let firebaseUpdateMetadata;

if (!appConfig.USE_MOCKS) {
  const { storage } = require('../config/firebase');
  const {
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata,
    updateMetadata
  } = require('firebase/storage');
  firebaseStorage = storage;
  firebaseRef = ref;
  firebaseUploadBytes = uploadBytes;
  firebaseUploadBytesResumable = uploadBytesResumable;
  firebaseGetDownloadURL = getDownloadURL;
  firebaseDeleteObject = deleteObject;
  firebaseListAll = listAll;
  firebaseGetMetadata = getMetadata;
  firebaseUpdateMetadata = updateMetadata;
}

/**
 * Upload a file to Firebase Storage
 * @param {string} path - Storage path (e.g., 'images/menu-items/item1.jpg')
 * @param {Blob|File} file - File to upload
 * @param {Object} metadata - Optional metadata object
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadFile = async (path, file, metadata = {}) => {
  if (appConfig.USE_MOCKS) {
    // Return mock URL
    return {
      url: `https://mock-storage.firebaseapp.com/${path}`,
      path
    };
  }

  try {
    const storageRef = firebaseRef(firebaseStorage, path);
    const uploadMetadata = {
      contentType: file.type || 'image/jpeg',
      ...metadata
    };

    await firebaseUploadBytes(storageRef, file, uploadMetadata);
    const url = await firebaseGetDownloadURL(storageRef);

    return { url, path };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload a file with progress tracking (resumable upload)
 * @param {string} path - Storage path
 * @param {Blob|File} file - File to upload
 * @param {Function} onProgress - Progress callback (receives {bytesTransferred, totalBytes})
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadFileWithProgress = async (path, file, onProgress) => {
  if (appConfig.USE_MOCKS) {
    if (onProgress) {
      // Simulate progress
      setTimeout(() => onProgress({ bytesTransferred: file.size / 2, totalBytes: file.size }), 100);
      setTimeout(() => onProgress({ bytesTransferred: file.size, totalBytes: file.size }), 200);
    }
    return {
      url: `https://mock-storage.firebaseapp.com/${path}`,
      path
    };
  }

  try {
    const storageRef = firebaseRef(firebaseStorage, path);
    const uploadTask = firebaseUploadBytesResumable(storageRef, file, {
      contentType: file.type || 'image/jpeg'
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            });
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const url = await firebaseGetDownloadURL(uploadTask.snapshot.ref);
            resolve({ url, path });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get download URL for a file
 * @param {string} path - Storage path
 * @returns {Promise<string>}
 */
export const getFileURL = async (path) => {
  if (appConfig.USE_MOCKS) {
    return `https://mock-storage.firebaseapp.com/${path}`;
  }

  try {
    const storageRef = firebaseRef(firebaseStorage, path);
    const url = await firebaseGetDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

/**
 * Delete a file from Storage
 * @param {string} path - Storage path
 * @returns {Promise<void>}
 */
export const deleteFile = async (path) => {
  if (appConfig.USE_MOCKS) {
    return;
  }

  try {
    const storageRef = firebaseRef(firebaseStorage, path);
    await firebaseDeleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * List all files in a directory
 * @param {string} path - Storage path (directory)
 * @returns {Promise<Array<{name: string, fullPath: string}>>}
 */
export const listFiles = async (path) => {
  if (appConfig.USE_MOCKS) {
    return [];
  }

  try {
    const storageRef = firebaseRef(firebaseStorage, path);
    const result = await firebaseListAll(storageRef);
    
    return result.items.map((item) => ({
      name: item.name,
      fullPath: item.fullPath
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Get file metadata
 * @param {string} path - Storage path
 * @returns {Promise<Object>}
 */
export const getFileMetadata = async (path) => {
  if (appConfig.USE_MOCKS) {
    return {
      size: 0,
      contentType: 'image/jpeg',
      timeCreated: new Date().toISOString()
    };
  }

  try {
    const storageRef = firebaseRef(firebaseStorage, path);
    const metadata = await firebaseGetMetadata(storageRef);
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
};

/**
 * Update file metadata
 * @param {string} path - Storage path
 * @param {Object} metadata - New metadata
 * @returns {Promise<void>}
 */
export const updateFileMetadata = async (path, metadata) => {
  if (appConfig.USE_MOCKS) {
    return;
  }

  try {
    const storageRef = firebaseRef(firebaseStorage, path);
    await firebaseUpdateMetadata(storageRef, metadata);
  } catch (error) {
    console.error('Error updating file metadata:', error);
    throw error;
  }
};

/**
 * Upload menu item image
 * @param {string} menuItemId - Menu item ID
 * @param {Blob|File} imageFile - Image file
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadMenuItemImage = async (menuItemId, imageFile) => {
  const timestamp = Date.now();
  const extension = imageFile.name?.split('.').pop() || 'jpg';
  const path = `menu-items/${menuItemId}/${timestamp}.${extension}`;
  return uploadFile(path, imageFile, {
    customMetadata: {
      menuItemId,
      uploadedAt: new Date().toISOString()
    }
  });
};

/**
 * Upload user profile image
 * @param {string} userId - User ID
 * @param {Blob|File} imageFile - Image file
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadUserProfileImage = async (userId, imageFile) => {
  const extension = imageFile.name?.split('.').pop() || 'jpg';
  const path = `users/${userId}/profile.${extension}`;
  return uploadFile(path, imageFile, {
    customMetadata: {
      userId,
      uploadedAt: new Date().toISOString()
    }
  });
};

export const storageService = {
  uploadFile,
  uploadFileWithProgress,
  getFileURL,
  deleteFile,
  listFiles,
  getFileMetadata,
  updateFileMetadata,
  uploadMenuItemImage,
  uploadUserProfileImage
};

