import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, File, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '../utils/api';
import toast from 'react-hot-toast';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFolderId: number;
  onUpload: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  isOpen,
  onClose,
  selectedFolderId,
  onUpload
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [encrypt, setEncrypt] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(file => 
        apiClient.uploadFile(file, selectedFolderId, encrypt)
      );

      await Promise.all(uploadPromises);
      
      toast.success(`${files.length} file(s) uploaded successfully`);
      setFiles([]);
      onUpload();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Files
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${isDragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop files here' : 'Choose files or drag them here'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Maximum file size: 50MB per file
              </p>
            </div>

            {/* Encryption Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="encrypt"
                checked={encrypt}
                onChange={(e) => setEncrypt(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="encrypt" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Encrypt files (recommended for sensitive data)
              </label>
            </div>

            {encrypt && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Files will be encrypted using your personal encryption key. 
                  Only you can decrypt and download them.
                </p>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Selected Files ({files.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <File className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : ''}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};