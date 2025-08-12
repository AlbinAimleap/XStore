import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Key, 
  Code, 
  File, 
  Lock,
  Pin,
  Copy,
  Download,
  Edit,
  Trash2,
  MoreVertical,
  Eye
} from 'lucide-react';
import { Item } from '../types';
import { createEncryptionService } from '../utils/encryption';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (itemId: number) => void;
  onPin: (itemId: number) => void;
  onDownload?: (item: Item) => void;
}

const getItemIcon = (type: Item['type']) => {
  switch (type) {
    case 'text':
      return FileText;
    case 'secret':
      return Lock;
    case 'api_key':
      return Key;
    case 'code':
      return Code;
    case 'file':
      return File;
    default:
      return FileText;
  }
};

const getItemColor = (type: Item['type']) => {
  switch (type) {
    case 'text':
      return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    case 'secret':
      return 'text-red-500 bg-red-100 dark:bg-red-900/30';
    case 'api_key':
      return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
    case 'code':
      return 'text-green-500 bg-green-100 dark:bg-green-900/30';
    case 'file':
      return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
    default:
      return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
  }
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onPin,
  onDownload
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const { encryptionKey } = useAuth();

  const Icon = getItemIcon(item.type);
  const colorClasses = getItemColor(item.type);

  const decryptContent = () => {
    if (!encryptionKey || !item.encrypted_content) return '';
    
    try {
      const encryptionService = createEncryptionService(encryptionKey);
      return encryptionService.decrypt(item.encrypted_content);
    } catch (error) {
      console.error('Error decrypting content:', error);
      return 'Error: Could not decrypt content';
    }
  };

  const handleCopy = async () => {
    const content = decryptContent();
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handlePreview = () => {
    if (!decryptedContent) {
      setDecryptedContent(decryptContent());
    }
    setShowPreview(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${colorClasses}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {item.type.replace('_', ' ')}
                  {item.language && ` • ${item.language}`}
                  {item.file_size && ` • ${formatFileSize(item.file_size)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {item.is_pinned && (
                <Pin className="w-4 h-4 text-amber-500" fill="currentColor" />
              )}
              
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                    >
                      {item.type !== 'file' && (
                        <>
                          <button
                            onClick={() => {
                              handlePreview();
                              setShowMenu(false);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Preview</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              handleCopy();
                              setShowMenu(false);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </button>
                        </>
                      )}

                      {item.type === 'file' && onDownload && (
                        <button
                          onClick={() => {
                            onDownload(item);
                            setShowMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onPin(item.id);
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Pin className="w-4 h-4" />
                        <span>{item.is_pinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          onEdit(item);
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          onDelete(item.id);
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {item.folder_name && `${item.folder_name} • `}
              {formatDate(item.created_at)}
            </span>
            {item.access_count > 0 && (
              <span>{item.access_count} views</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-96">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {decryptedContent}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};