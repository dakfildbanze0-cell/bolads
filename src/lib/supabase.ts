import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Image uploads will fail.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'boladas-auth-token',
    lockAcquireTimeout: 60000, // Increased timeout to avoid lock errors
  }
});

/**
 * Uploads a base64 or File object to Supabase Storage
 * @param file The file or base64 string to upload
 * @param bucket The storage bucket name
 * @param path The path within the bucket
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
  file: File | string, 
  bucket: string = 'images', 
  path: string = 'uploads'
): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase não configurado.");
  }

  let fileToUpload: File | Blob;
  let fileName: string;

  if (typeof file === 'string') {
    // Convert base64 to Blob more reliably
    const parts = file.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    fileToUpload = new Blob([u8arr], { type: mime });
    const extension = mime.split('/')[1] || 'jpg';
    fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
  } else {
    fileToUpload = file;
    const extension = file.name.split('.').pop();
    fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileToUpload, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    if (uploadError.message.includes('bucket not found')) {
      throw new Error(`O bucket "${bucket}" não foi encontrado no Supabase. Certifique-se de criá-lo no painel do Supabase com acesso público.`);
    }
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return data.publicUrl;
}
