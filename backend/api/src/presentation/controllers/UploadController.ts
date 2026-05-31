import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getSupabaseClient } from '../../config/supabase';
import { ok } from '../../shared/response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../../shared/errors';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400));
  },
});

const kycUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Only images and PDF allowed', 400));
  },
});

export const uploadSingleAvatar = upload.single('avatar');
export const uploadKycDoc = kycUpload.single('document');

export class UploadController {
  private get db() { return getSupabaseClient(); }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const file = req.file;
      if (!file) throw new AppError('No file uploaded', 400);

      const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      // Always overwrite same path so old photo is replaced automatically
      const path = `${user.sub}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await this.db.storage
        .from('avatars')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true, // overwrite if exists
        });

      if (uploadError) throw new AppError(uploadError.message, 500);

      // Get public URL
      const { data: { publicUrl } } = this.db.storage
        .from('avatars')
        .getPublicUrl(path);

      // Add cache-bust so the app always loads fresh image
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Persist URL in users table — survives any reload
      const { error: dbError } = await this.db
        .from('users')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.sub);

      if (dbError) throw new AppError(dbError.message, 500);

      ok(res, { avatar_url: avatarUrl }, 'Profile photo updated');
    } catch (e) { next(e); }
  }

  async deleteAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;

      // Remove all avatar files for this user
      const { data: files } = await this.db.storage
        .from('avatars')
        .list(user.sub);

      if (files && files.length > 0) {
        const paths = files.map(f => `${user.sub}/${f.name}`);
        await this.db.storage.from('avatars').remove(paths);
      }

      // Clear avatar_url in database
      await this.db
        .from('users')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.sub);

      ok(res, null, 'Profile photo removed');
    } catch (e) { next(e); }
  }

  async uploadKycDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const file = req.file;
      const docType = req.body.type as string; // 'license' | 'national_id' | 'vehicle_photo' | 'insurance'

      if (!file) throw new AppError('No file uploaded', 400);
      if (!docType) throw new AppError('Document type required (license/national_id/vehicle_photo/insurance)', 400);

      const ext = file.mimetype === 'application/pdf' ? 'pdf' : file.mimetype === 'image/png' ? 'png' : 'jpg';
      const path = `${user.sub}/${docType}.${ext}`;

      const { error: uploadError } = await this.db.storage
        .from('kyc-documents')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) throw new AppError(uploadError.message, 500);

      // For KYC docs, generate a signed URL (private bucket)
      const { data: signedData, error: signedError } = await this.db.storage
        .from('kyc-documents')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (signedError) throw new AppError(signedError.message, 500);

      // Update kyc_documents table with file URL
      const colMap: Record<string, string> = {
        license: 'license_url',
        national_id: 'national_id_url',
        vehicle_photo: 'vehicle_photo_url',
        insurance: 'insurance_url',
      };

      const col = colMap[docType];
      if (col) {
        await this.db
          .from('kyc_documents')
          .upsert({ user_id: user.sub, [col]: path, status: 'pending', submitted_at: new Date().toISOString() });
      }

      ok(res, { url: signedData?.signedUrl, path }, 'Document uploaded');
    } catch (e) { next(e); }
  }

  async uploadDeliveryProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const file = req.file;
      const errandId = req.body.errand_id as string;

      if (!file) throw new AppError('No file uploaded', 400);
      if (!errandId) throw new AppError('errand_id required', 400);

      const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
      const path = `${user.sub}/${errandId}.${ext}`;

      const { error: uploadError } = await this.db.storage
        .from('delivery-proofs')
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

      if (uploadError) throw new AppError(uploadError.message, 500);

      const { data: { publicUrl } } = this.db.storage
        .from('delivery-proofs')
        .getPublicUrl(path);

      // Save proof URL to errand
      await this.db
        .from('errands')
        .update({ proof_of_delivery_url: publicUrl })
        .eq('id', errandId)
        .eq('rider_id', user.sub);

      ok(res, { proof_url: publicUrl }, 'Delivery proof uploaded');
    } catch (e) { next(e); }
  }
}

export const uploadController = new UploadController();
