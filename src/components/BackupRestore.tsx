import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient } from '../utils/api';
import toast from 'react-hot-toast';

interface BackupRestoreProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  isOpen,
  onClose,
  onRestore
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const backupData = await apiClient.exportData();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xstore-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Backup exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!backupFile) return;

    setIsImporting(true);

    try {
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);

      await apiClient.importData(backupData, clearExisting);
      
      toast.success('Backup restored successfully');
      onRestore();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to restore backup');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast.error('Please select a valid JSON backup file');
        return;
      }
      setBackupFile(file);
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
                Backup & Restore
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'export'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Export Backup
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'import'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Import Backup
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'export' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <Download className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Export Your Data
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create an encrypted backup of all your folders, items, and settings.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-2">What's included:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>All folders and their structure</li>
                        <li>All items (text, secrets, API keys, code snippets)</li>
                        <li>Tags and metadata</li>
                        <li>Pin status and access counts</li>
                      </ul>
                      <p className="mt-3 text-xs">
                        Note: File attachments are not included in backups for security reasons.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {isExporting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span>{isExporting ? 'Exporting...' : 'Export Backup'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Import Backup
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Restore your data from a previously exported backup file.
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      <p className="font-medium mb-1">Important:</p>
                      <p>
                        Only import backup files that you created from XStore. 
                        Importing will decrypt the backup using your current encryption key.
                      </p>
                    </div>
                  </div>
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Backup File
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {backupFile && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      Selected: {backupFile.name}
                    </p>
                  )}
                </div>

                {/* Clear Existing Option */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="clearExisting"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="clearExisting" className="text-sm text-gray-700 dark:text-gray-300">
                    Clear existing data before importing (recommended)
                  </label>
                </div>

                <button
                  onClick={handleImport}
                  disabled={!backupFile || isImporting}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isImporting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span>{isImporting ? 'Importing...' : 'Import Backup'}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};