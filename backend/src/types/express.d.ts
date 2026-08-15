import { Profile, User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & { profile?: Profile | null };
      file?: import('multer').File;
      files?: { [fieldname: string]: import('multer').File[] } | import('multer').File[];
    }
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      }
    }
  }
}
