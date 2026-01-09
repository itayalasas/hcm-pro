import { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentFile?: string;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function FileUpload({
  onFileSelect,
  currentFile,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  maxSizeMB = 10,
  label = 'Subir Documento'
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    if (file.size > maxSizeBytes) {
      setError(`El archivo excede el tamaño máximo de ${maxSizeMB}MB`);
      return false;
    }

    const acceptedTypes = accept.split(',').map(t => t.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!acceptedTypes.includes(fileExtension)) {
      setError(`Tipo de archivo no permitido. Formatos aceptados: ${accept}`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {!selectedFile && !currentFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            accept={accept}
            className="hidden"
          />

          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />

          <p className="text-sm text-slate-600 mb-2">
            Arrastra y suelta tu archivo aquí, o
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Seleccionar Archivo
          </Button>

          <p className="text-xs text-slate-500 mt-3">
            Formatos: {accept}
          </p>
          <p className="text-xs text-slate-500">
            Tamaño máximo: {maxSizeMB}MB
          </p>
        </div>
      )}

      {selectedFile && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <File className="w-10 h-10 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600">Archivo seleccionado</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {!selectedFile && currentFile && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <File className="w-10 h-10 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {currentFile}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Archivo actual
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Cambiar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleInputChange}
              accept={accept}
              className="hidden"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
