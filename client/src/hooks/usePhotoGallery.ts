import { useState } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  base64Data?: string;
}

export function usePhotoGallery() {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);

  const takePhoto = async (): Promise<UserPhoto | undefined> => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
        width: 600
      });
      
      const fileName = new Date().getTime() + '.jpeg';
      
      const newPhoto: UserPhoto = {
        filepath: fileName,
        webviewPath: photo.webPath
      };
      
      setPhotos([newPhoto, ...photos]);
      return newPhoto;
    } catch (error) {
      console.error('Error taking photo:', error);
      return undefined;
    }
  };

  const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto | undefined> => {
    try {
      const base64Data = await readAsBase64(photo);
      
      const newPhoto: UserPhoto = {
        filepath: fileName,
        webviewPath: photo.webPath,
        base64Data
      };
      
      return newPhoto;
    } catch (error) {
      console.error('Error saving photo:', error);
      return undefined;
    }
  };

  const readAsBase64 = async (photo: Photo): Promise<string> => {
    // Fetch the photo, read as a blob, then convert to base64 format
    try {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      
      return await convertBlobToBase64(blob) as string;
    } catch (error) {
      console.error('Error reading as base64:', error);
      throw error;
    }
  };
  
  const convertBlobToBase64 = (blob: Blob): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };

  const convertPhotoToBlob = async (photo: Photo): Promise<File | null> => {
    try {
      if (!photo.webPath) return null;
      
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      
      return new File([blob], 'photo.jpg', {
        type: blob.type,
      });
    } catch (error) {
      console.error('Error converting photo to blob:', error);
      return null;
    }
  };

  const convertUserPhotoToFile = async (userPhoto: UserPhoto): Promise<File | null> => {
    try {
      if (!userPhoto.webviewPath) return null;
      
      const response = await fetch(userPhoto.webviewPath);
      const blob = await response.blob();
      
      return new File([blob], userPhoto.filepath, {
        type: blob.type,
      });
    } catch (error) {
      console.error('Error converting user photo to file:', error);
      return null;
    }
  };

  return {
    photos,
    takePhoto,
    savePicture,
    convertPhotoToBlob,
    convertUserPhotoToFile
  };
}