import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Cloudflare R2 configuration (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'unicard-files';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

/**
 * Generate a unique filename
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0]; // Use first part of UUID
  const extension = originalFilename.split('.').pop();
  return `${timestamp}-${uuid}.${extension}`;
};

/**
 * Upload a file to R2
 */
export const uploadFile = async (
  file: Buffer,
  filename: string,
  folder: string,
  contentType: string
): Promise<string> => {
  const key = `${folder}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    await r2Client.send(command);
    
    // Return public URL
    const publicUrl = PUBLIC_URL 
      ? `${PUBLIC_URL}/${key}`
      : `https://${BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
    
    return publicUrl;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload file to storage');
  }
};

/**
 * Delete a file from R2
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // Extract key from URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete file from storage');
  }
};

/**
 * Upload student photo
 */
export const uploadStudentPhoto = async (
  file: Buffer,
  schoolId: string,
  studentId: string,
  contentType: string
): Promise<string> => {
  const filename = `${studentId}.png`; // Always save as PNG
  const folder = `student-photos/${schoolId}`;
  return await uploadFile(file, filename, folder, contentType);
};

/**
 * Upload school logo
 */
export const uploadSchoolLogo = async (
  file: Buffer,
  schoolId: string,
  contentType: string
): Promise<string> => {
  const filename = 'logo.png';
  const folder = `school-assets/${schoolId}`;
  return await uploadFile(file, filename, folder, contentType);
};

/**
 * Upload school signature
 */
export const uploadSchoolSignature = async (
  file: Buffer,
  schoolId: string,
  contentType: string
): Promise<string> => {
  const filename = 'signature.png';
  const folder = `school-assets/${schoolId}`;
  return await uploadFile(file, filename, folder, contentType);
};

/**
 * Validate file type
 */
export const validateFileType = (mimetype: string): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file size (max 5MB)
 */
export const validateFileSize = (size: number): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  return size <= maxSize;
};

export default r2Client;
