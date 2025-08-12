import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Tag, Code } from 'lucide-react';
import { Item, CreateItemData, UpdateItemData } from '../types';
import { createEncryptionService } from '../utils/encryption';
import { useAuth } from '../hooks/useAuth';

interface ItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemData | UpdateItemData) => Promise<void>;
  editItem?: Item;
  selectedFolderId?: number;
}

const ITEM_TYPES = [
  { value: 'text', label: 'Text Note', description: 'Plain text content' },
  { value: 'secret', label: 'Secret', description: 'Sensitive information' },
  { value: 'api_key', label: 'API Key', description: 'API keys and tokens' },
  { value: 'code', label: 'Code Snippet', description: 'Code with syntax highlighting' },
] as const;

const PROGRAMMING_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
  'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'dart', 'html',
  'css', 'sql', 'bash', 'powershell', 'yaml', 'json', 'xml', 'markdown'
];

export const ItemForm: React.FC<ItemFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editItem,
  selectedFolderId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'text' as Item['type'],
    content: '',
    language: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { encryptionKey } = useAuth();

  useEffect(() => {
    if (editItem && encryptionKey) {
      try {
        const encryptionService = createEncryptionService(encryptionKey);
        const decryptedContent = editItem.encrypted_content 
          ? encryptionService.decrypt(editItem.encrypted_content)
          : '';

        setFormData({
          name: editItem.name,
          type: editItem.type,
          content: decryptedContent,
          language: editItem.language || '',
          tags: editItem.tags || [],
        });
      } catch (error) {
        console.error('Error decrypting content:', error);
      }
    } else if (!editItem) {
      setFormData({
        name: '',
        type: 'text',
        content: '',
        language: '',
        tags: [],
      });
    }
  }, [editItem, encryptionKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.content.trim()) {
      return;
    }

    if (!encryptionKey) {
      console.error('No encryption key available');
      return;
    }

    setIsLoading(true);

    try {
      const encryptionService = createEncryptionService(encryptionKey);
      const encryptedContent = encryptionService.encrypt(formData.content);

      const submitData = {
        name: formData.name.trim(),
        encryptedContent,
        language: formData.type === 'code' ? formData.language : undefined,
        tags: formData.tags.filter(tag => tag.trim()),
        ...(editItem ? {} : { 
          type: formData.type, 
          folderId: selectedFolderId || 1 
        })
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      handleAddTag();
    }
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
                {editItem ? 'Edit Item' : 'Create New Item'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="Enter item name"
                  required
                />
              </div>

              {/* Type (only for new items) */}
              {!editItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ITEM_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={`
                          p-4 border-2 rounded-lg cursor-pointer transition-all
                          ${formData.type === type.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          value={type.value}
                          checked={formData.type === type.value}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            type: e.target.value as Item['type'] 
                          }))}
                          className="sr-only"
                        />
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {type.description}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Language (for code items) */}
              {formData.type === 'code' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Code className="w-4 h-4 inline mr-1" />
                    Programming Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value="">Select language</option>
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white font-mono"
                  placeholder={`Enter your ${formData.type === 'code' ? 'code' : formData.type}...`}
                  rows={formData.type === 'code' ? 12 : 8}
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.name.trim() || !formData.content.trim()}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};