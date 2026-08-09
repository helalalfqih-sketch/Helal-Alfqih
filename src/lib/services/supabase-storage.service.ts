import { supabase } from "@/integrations/supabase/client";

export type StorageBucket = "products" | "media" | "documents" | "uploads";

export interface StorageUploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

export const SupabaseStorageService = {
  /**
   * Upload a file to a specific storage bucket.
   */
  async uploadFile(
    bucket: StorageBucket,
    filePath: string,
    file: File | Blob,
    options?: StorageUploadOptions,
  ) {
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: options?.cacheControl || "3600",
      contentType: options?.contentType,
      upsert: options?.upsert ?? true,
    });

    if (error) {
      console.error(`[SupabaseStorage] Upload error in bucket ${bucket}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Get a public URL for a file in a public bucket.
   */
  getPublicUrl(bucket: StorageBucket, filePath: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Generate a temporary signed URL for private bucket access (e.g. documents).
   */
  async createSignedUrl(
    bucket: StorageBucket,
    filePath: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      console.error(`[SupabaseStorage] Signed URL error in bucket ${bucket}:`, error);
      throw error;
    }

    return data.signedUrl;
  },

  /**
   * Delete a file from a storage bucket.
   */
  async deleteFile(bucket: StorageBucket, filePath: string) {
    const { data, error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error(`[SupabaseStorage] Delete error in bucket ${bucket}:`, error);
      throw error;
    }

    return data;
  },
};
