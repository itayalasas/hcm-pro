import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

interface UploadOptions {
  bucket: string;
  folder: string;
  companyId: string;
}

interface UploadResult {
  path: string;
  name: string;
  size: number;
  type: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showToast } = useToast();

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setProgress(0);

      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${options.companyId}/${options.folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setProgress(100);

      return {
        path: filePath,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      showToast(error.message || 'Error al subir archivo', 'error');
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      showToast(error.message || 'Error al eliminar archivo', 'error');
      return false;
    }
  };

  const getPublicUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const downloadFile = async (bucket: string, path: string, fileName: string): Promise<void> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Archivo descargado exitosamente', 'success');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      showToast(error.message || 'Error al descargar archivo', 'error');
    }
  };

  return {
    uploadFile,
    deleteFile,
    getPublicUrl,
    downloadFile,
    uploading,
    progress
  };
}
