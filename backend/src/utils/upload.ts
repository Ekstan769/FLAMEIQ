import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { logger } from './logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param fileBuffer The buffer of the file to upload.
 * @param folder The folder in Cloudinary to upload to.
 * @returns The secure URL of the uploaded file.
 */
export const uploadToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          logger.error({ err: error }, 'Cloudinary upload failed');
          return reject(new Error('Failed to upload file.'));
        }
        resolve(result!.secure_url);
      },
    );
    uploadStream.end(fileBuffer);
  });
};