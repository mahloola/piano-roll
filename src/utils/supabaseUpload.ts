import { supabase } from '../supabaseClient';

interface UploadFileParams {
  file: File;
  userId: string;
}

interface UploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export const uploadFile = async ({
  file,
  userId,
}: UploadFileParams): Promise<UploadResult> => {
  try {
    // 1. Generate unique file path in user's folder
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // 2. Upload file to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('midi-files') // Your bucket name
      .upload(filePath, file);

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return { success: false, error: storageError.message };
    }

    // 3. Create database record for the file
    const { data: dbData, error: dbError } = await supabase
      .from('files')
      .insert({
        user_id: userId,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select() // Returns the inserted row
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);

      // Clean up: Delete the uploaded file if DB insert fails
      await supabase.storage.from('mid-files').remove([filePath]);

      return { success: false, error: dbError.message };
    }

    return {
      success: true,
      fileId: dbData.id,
    };
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};
