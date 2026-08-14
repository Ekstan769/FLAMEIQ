import { Request, Response } from 'express';
import { uploadToCloudinary } from '../utils/upload.js';
import { prisma } from '@/db/prisma.js';

export const uploadProfilePicture = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'profile_pictures');

    // Update the user's profile with the new image URL
    await prisma.profile.upsert({
      where: { userId },
      update: { profilePic: imageUrl },
      create: { userId, profilePic: imageUrl },
    });

    return res.status(200).json({ success: true, message: 'Profile picture updated successfully.', url: imageUrl });
  } catch (error) {
    // The upload utility already logs the specific error
    return res.status(500).json({ success: false, message: 'An error occurred during file upload.' });
  }
};