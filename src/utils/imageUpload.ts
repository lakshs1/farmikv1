import { supabase } from "@/integrations/supabase/client";

/**
 * Upload an image file to Supabase Storage bucket 'farmik-media'.
 * Gracefully falls back to a high-quality base64 Data URL if Supabase storage is unavailable.
 */
export async function uploadImageFile(file: File, folder: "sliders" | "products" | "offers" = "products"): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const filePath = `${folder}/${Date.now()}_${cleanName}.${fileExt}`;

  try {
    const { data, error } = await supabase.storage
      .from('farmik-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: urlData } = supabase.storage
        .from('farmik-media')
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        return urlData.publicUrl;
      }
    }
  } catch (err) {
    console.warn("Supabase storage upload failed, falling back to Data URL:", err);
  }

  // Fallback: convert to base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image file"));
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload multiple images concurrently
 */
export async function uploadMultipleImageFiles(files: FileList | File[], folder: "sliders" | "products" | "offers" = "products"): Promise<string[]> {
  const fileArray = Array.from(files);
  const uploadPromises = fileArray.map(file => uploadImageFile(file, folder));
  return Promise.all(uploadPromises);
}
