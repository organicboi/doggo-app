import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageUploadOptions {
  userId: string;
  imageType: 'profile' | 'cover';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class ImageService {
  private static readonly PROFILE_BUCKET = 'user-profile-image';
  private static readonly COVER_BUCKET = 'user-cover-image';
  private static readonly PROFILE_IMAGE_SIZE = { width: 400, height: 400 };
  private static readonly COVER_IMAGE_SIZE = { width: 800, height: 400 };

  /**
   * Request camera and media library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraPermission.status === 'granted' && mediaPermission.status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Pick image from gallery with options
   */
  static async pickImageFromGallery(options: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  } = {}): Promise<ImagePicker.ImagePickerResult> {
    const {
      allowsEditing = true,
      aspect = [1, 1],
      quality = 0.8
    } = options;

    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect,
      quality,
    });
  }

  /**
   * Take photo with camera
   */
  static async takePhoto(options: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  } = {}): Promise<ImagePicker.ImagePickerResult> {
    const {
      allowsEditing = true,
      aspect = [1, 1],
      quality = 0.8
    } = options;

    return await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect,
      quality,
    });
  }

  /**
   * Compress and resize image based on type
   */
  static async processImage(
    uri: string, 
    imageType: 'profile' | 'cover',
    quality: number = 0.8
  ): Promise<string> {
    try {
      const targetSize = imageType === 'profile' 
        ? this.PROFILE_IMAGE_SIZE 
        : this.COVER_IMAGE_SIZE;

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: targetSize }
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Upload image to Supabase storage
   */
  static async uploadImage(options: ImageUploadOptions & { imageUri: string }): Promise<ImageUploadResult> {
    const { userId, imageType, imageUri, quality = 0.8 } = options;

    try {
      // Get appropriate bucket based on image type
      const bucketName = imageType === 'profile' ? this.PROFILE_BUCKET : this.COVER_BUCKET;

      // Process the image first
      const processedUri = await this.processImage(imageUri, imageType, quality);

      // Create file name and path
      const fileExtension = 'jpg';
      const fileName = `${imageType}_${Date.now()}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, byteArray, {
          contentType: 'image/jpeg',
          upsert: true, // Replace existing file if it exists
        });

      if (error) {
        console.error('Storage upload error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
      };

    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete old image from storage
   */
  static async deleteImage(imageUrl: string, imageType: 'profile' | 'cover'): Promise<boolean> {
    try {
      // Get appropriate bucket based on image type
      const bucketName = imageType === 'profile' ? this.PROFILE_BUCKET : this.COVER_BUCKET;
      
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === bucketName);
      
      if (bucketIndex === -1) {
        console.warn('Invalid image URL format');
        return false;
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteImage:', error);
      return false;
    }
  }

  /**
   * Get user's profile image URL
   */
  static async getUserProfileImage(userId: string): Promise<string | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return null;
      }

      return user.avatar_url;
    } catch (error) {
      console.error('Error getting user profile image:', error);
      return null;
    }
  }

  /**
   * Get user's cover image URL
   */
  static async getUserCoverImage(userId: string): Promise<string | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('cover_image_url')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return null;
      }

      return user.cover_image_url;
    } catch (error) {
      console.error('Error getting user cover image:', error);
      return null;
    }
  }

  /**
   * Update user profile image in database
   */
  static async updateUserProfileImage(userId: string, imageUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          avatar_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserProfileImage:', error);
      return false;
    }
  }

  /**
   * Update user cover image in database
   */
  static async updateUserCoverImage(userId: string, imageUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          cover_image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating cover image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserCoverImage:', error);
      return false;
    }
  }

  /**
   * Complete image upload and database update process
   */
  static async uploadAndUpdateProfileImage(
    userId: string, 
    imageUri: string, 
    imageType: 'profile' | 'cover'
  ): Promise<ImageUploadResult> {
    try {
      // Upload image to storage
      const uploadResult = await this.uploadImage({
        userId,
        imageType,
        imageUri,
        quality: 0.8,
      });

      if (!uploadResult.success || !uploadResult.url) {
        return uploadResult;
      }

      // Update database
      const updateSuccess = imageType === 'profile'
        ? await this.updateUserProfileImage(userId, uploadResult.url)
        : await this.updateUserCoverImage(userId, uploadResult.url);

      if (!updateSuccess) {
        return {
          success: false,
          error: 'Failed to update database with new image URL',
        };
      }

      return {
        success: true,
        url: uploadResult.url,
      };

    } catch (error) {
      console.error('Error in uploadAndUpdateProfileImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get default profile image URL
   */
  static getDefaultProfileImage(): string {
    return 'https://images.unsplash.com/photo-1494790108755-2616b9a9e3e0?w=400&h=400&fit=crop&crop=face';
  }

  /**
   * Get default cover image URL
   */
  static getDefaultCoverImage(): string {
    return 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=400&fit=crop';
  }

  /**
   * Create user folder structure (called when user signs up)
   */
  static async createUserFolder(userId: string): Promise<boolean> {
    try {
      // Create placeholder files in both buckets to ensure folders exist
      const placeholderContent = new TextEncoder().encode('User folder created');
      
      // Create folder in profile bucket
      const { error: profileError } = await supabase.storage
        .from(this.PROFILE_BUCKET)
        .upload(`${userId}/.placeholder`, placeholderContent, {
          contentType: 'text/plain',
        });

      // Create folder in cover bucket
      const { error: coverError } = await supabase.storage
        .from(this.COVER_BUCKET)
        .upload(`${userId}/.placeholder`, placeholderContent, {
          contentType: 'text/plain',
        });

      if (profileError || coverError) {
        console.error('Error creating user folders:', { profileError, coverError });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createUserFolder:', error);
      return false;
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(
    originalUrl: string, 
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): string {
    // If using Supabase storage, you can add transformation parameters
    // This is a placeholder for future optimization
    return originalUrl;
  }
} 