import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Download, Settings } from 'lucide-react';
import { Layout } from './Layout';
import { FolderTree } from './FolderTree';
import { ItemCard } from './ItemCard';
import { ItemForm } from './ItemForm';
import { FileUpload } from './FileUpload';
import { BackupRestore } from './BackupRestore';
import { Folder, Item, CreateItemData, UpdateItemData } from '../types';
import { apiClient } from '../utils/api';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>();
  const [currentView, setCurrentView] = useState<'folder' | 'frequent'>('folder');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentView === 'folder') {
      loadItems();
    } else if (currentView === 'frequent') {
      loadFrequentItems();
    }
  }, [selectedFolderId, currentView, searchQuery]);

  const loadInitialData = async () => {
    try {
      const [foldersData] = await Promise.all([
        apiClient.getFolders(),
      ]);
      
      setFolders(foldersData);
      
      // Find root folder and select it
      const rootFolder = foldersData.find((f: Folder) => f.name === 'Root' && !f.parent_id);
      if (rootFolder) {
        setSelectedFolderId(rootFolder.id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const params: any = {};
      
      if (currentView === 'folder' && selectedFolderId) {
        params.folder_id = selectedFolderId;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const itemsData = await apiClient.getItems(params);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items');
    }
  };

  const loadFrequentItems = async () => {
    try {
      const itemsData = await apiClient.getFrequentItems();
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading frequent items:', error);
      toast.error('Failed to load frequent items');
    }
  };

  const handleCreateFolder = async (name: string, parentId?: number) => {
    try {
      const newFolder = await apiClient.createFolder(name, parentId);
      setFolders(prev => [...prev, newFolder]);
      toast.success('Folder created');
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast.error(error.message || 'Failed to create folder');
    }
  };

  const handleUpdateFolder = async (id: number, name: string, parentId?: number) => {
    try {
      const updatedFolder = await apiClient.updateFolder(id, name, parentId);
      setFolders(prev => prev.map(f => f.id === id ? updatedFolder : f));
      toast.success('Folder updated');
    } catch (error: any) {
      console.error('Error updating folder:', error);
      toast.error(error.message || 'Failed to update folder');
    }
  };

  const handleDeleteFolder = async (id: number) => {
    try {
      await apiClient.deleteFolder(id);
      setFolders(prev => prev.filter(f => f.id !== id));
      
      if (selectedFolderId === id) {
        const rootFolder = folders.find(f => f.name === 'Root' && !f.parent_id);
        if (rootFolder) {
          setSelectedFolderId(rootFolder.id);
        }
      }
      
      toast.success('Folder deleted');
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast.error(error.message || 'Failed to delete folder');
    }
  };

  const handleCreateItem = async (data: CreateItemData) => {
    try {
      const newItem = await apiClient.createItem(data);
      setItems(prev => [newItem, ...prev]);
      toast.success('Item created');
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast.error(error.message || 'Failed to create item');
    }
  };

  const handleUpdateItem = async (data: UpdateItemData) => {
    if (!editingItem) return;

    try {
      const updatedItem = await apiClient.updateItem(editingItem.id, data);
      setItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
      setEditingItem(undefined);
      toast.success('Item updated');
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await apiClient.deleteItem(id);
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success('Item deleted');
      } catch (error: any) {
        console.error('Error deleting item:', error);
        toast.error(error.message || 'Failed to delete item');
      }
    }
  };

  const handlePinItem = async (id: number) => {
    try {
      const result = await apiClient.togglePin(id);
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_pinned: result.pinned } : item
      ));
      toast.success(result.pinned ? 'Item pinned' : 'Item unpinned');
    } catch (error: any) {
      console.error('Error toggling pin:', error);
      toast.error(error.message || 'Failed to toggle pin');
    }
  };

  const handleDownloadFile = async (item: Item) => {
    try {
      const blob = await apiClient.downloadFile(item.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('folder');
  };

  const handleShowFrequent = () => {
    setCurrentView('frequent');
    setSearchQuery('');
  };

  const handleSelectFolder = (folderId: number) => {
    setSelectedFolderId(folderId);
    setCurrentView('folder');
    setSearchQuery('');
  };

  const sidebarContent = (
    <div className="space-y-6">
      <FolderTree
        folders={folders}
        selectedFolderId={currentView === 'folder' ? selectedFolderId : undefined}
        onSelectFolder={handleSelectFolder}
        onCreateFolder={handleCreateFolder}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={handleDeleteFolder}
      />
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <button
            onClick={() => setShowFileUpload(true)}
            className="w-full flex items-center space-x-3 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Upload File</span>
          </button>
          
          <button
            onClick={() => setShowBackupRestore(true)}
            className="w-full flex items-center space-x-3 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Backup & Restore</span>
          </button>
        </div>
      </div>
    </div>
  );

  const getCurrentViewTitle = () => {
    if (currentView === 'frequent') {
      return 'Frequently Used Items';
    }
    
    if (searchQuery) {
      return `Search Results for "${searchQuery}"`;
    }
    
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder ? `${folder.name} Folder` : 'Items';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout
      sidebarContent={sidebarContent}
      onSearch={handleSearch}
      onShowFrequent={handleShowFrequent}
      onCreateItem={() => setShowItemForm(true)}
    >
      <div className="p-6 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getCurrentViewTitle()}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            
            <button
              onClick={() => setShowItemForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Item</span>
            </button>
          </div>

          {/* Items Grid */}
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Plus className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No items yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first item or uploading a file
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowItemForm(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Create Item
                </button>
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Upload File
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setShowItemForm(true);
                  }}
                  onDelete={handleDeleteItem}
                  onPin={handlePinItem}
                  onDownload={item.type === 'file' ? handleDownloadFile : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ItemForm
        isOpen={showItemForm}
        onClose={() => {
          setShowItemForm(false);
          setEditingItem(undefined);
        }}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        editItem={editingItem}
        selectedFolderId={selectedFolderId}
      />

      <FileUpload
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        selectedFolderId={selectedFolderId}
        onUpload={() => {
          loadItems();
          setShowFileUpload(false);
        }}
      />

      <BackupRestore
        isOpen={showBackupRestore}
        onClose={() => setShowBackupRestore(false)}
        onRestore={() => {
          loadInitialData();
          setShowBackupRestore(false);
        }}
      />
    </Layout>
  );
};