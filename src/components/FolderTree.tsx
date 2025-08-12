import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Folder as FolderType } from '../types';
import { useDropzone } from 'react-dropzone';

interface FolderTreeProps {
  folders: FolderType[];
  selectedFolderId?: number;
  onSelectFolder: (folderId: number) => void;
  onCreateFolder: (name: string, parentId?: number) => Promise<void>;
  onUpdateFolder: (id: number, name: string, parentId?: number) => Promise<void>;
  onDeleteFolder: (id: number) => Promise<void>;
  onDropItems?: (folderId: number, itemIds: number[]) => Promise<void>;
}

interface TreeNodeProps {
  folder: FolderType;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onCreateFolder: (name: string, parentId?: number) => Promise<void>;
  onUpdateFolder: (id: number, name: string, parentId?: number) => Promise<void>;
  onDeleteFolder: (id: number) => Promise<void>;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  folder,
  level,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const hasChildren = folder.children && folder.children.length > 0;

  const { getRootProps, isDragOver } = useDropzone({
    onDrop: (acceptedFiles) => {
      // Handle file drops for uploads
      console.log('Files dropped on folder:', folder.id, acceptedFiles);
    },
    noClick: true,
  });

  const handleEdit = async () => {
    if (editName.trim() && editName !== folder.name) {
      try {
        await onUpdateFolder(folder.id, editName.trim());
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating folder:', error);
      }
    } else {
      setIsEditing(false);
      setEditName(folder.name);
    }
  };

  const handleDelete = async () => {
    if (folder.name === 'Root') {
      return; // Cannot delete root folder
    }
    
    if (window.confirm(`Are you sure you want to delete "${folder.name}"?`)) {
      try {
        await onDeleteFolder(folder.id);
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const handleCreateSubfolder = async () => {
    const name = window.prompt('Enter folder name:');
    if (name?.trim()) {
      try {
        await onCreateFolder(name.trim(), folder.id);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          relative flex items-center space-x-2 px-3 py-2 mx-2 rounded-lg cursor-pointer group transition-all
          ${isSelected 
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }
          ${isDragOver ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300' : ''}
        `}
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Folder Icon */}
        <div className="flex-shrink-0">
          {isSelected || isExpanded ? (
            <FolderOpen className="w-5 h-5" />
          ) : (
            <Folder className="w-5 h-5" />
          )}
        </div>

        {/* Folder Name */}
        <div className="flex-1 min-w-0" onClick={onSelect}>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditName(folder.name);
                }
              }}
              className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          ) : (
            <span className="text-sm font-medium truncate">{folder.name}</span>
          )}
        </div>

        {/* Menu Button */}
        {!isEditing && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Context Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                  <button
                    onClick={() => {
                      handleCreateSubfolder();
                      setShowMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Subfolder</span>
                  </button>
                  
                  {folder.name !== 'Root' && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Rename</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {folder.children!.map((child) => (
              <TreeNodeContainer
                key={child.id}
                folder={child}
                level={level + 1}
                selectedFolderId={undefined}
                onSelectFolder={() => {}}
                onCreateFolder={onCreateFolder}
                onUpdateFolder={onUpdateFolder}
                onDeleteFolder={onDeleteFolder}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TreeNodeContainerProps {
  folder: FolderType;
  level: number;
  selectedFolderId?: number;
  onSelectFolder: (folderId: number) => void;
  onCreateFolder: (name: string, parentId?: number) => Promise<void>;
  onUpdateFolder: (id: number, name: string, parentId?: number) => Promise<void>;
  onDeleteFolder: (id: number) => Promise<void>;
}

const TreeNodeContainer: React.FC<TreeNodeContainerProps> = (props) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set([1])); // Expand root by default

  const toggleExpanded = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <TreeNode
      {...props}
      isSelected={props.folder.id === props.selectedFolderId}
      isExpanded={expandedFolders.has(props.folder.id)}
      onToggle={() => toggleExpanded(props.folder.id)}
      onSelect={() => props.onSelectFolder(props.folder.id)}
    />
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set([1])); // Expand root by default

  // Build folder hierarchy
  const buildFolderTree = (folders: FolderType[]): FolderType[] => {
    const folderMap = new Map<number, FolderType>();
    const rootFolders: FolderType[] = [];

    // Create folder map
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build hierarchy
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;
      
      if (folder.parent_id === null) {
        rootFolders.push(folderWithChildren);
      } else {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children!.push(folderWithChildren);
        }
      }
    });

    return rootFolders;
  };

  const toggleExpanded = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const folderTree = buildFolderTree(folders);

  const renderFolder = (folder: FolderType, level: number): React.ReactNode => {
    return (
      <TreeNode
        key={folder.id}
        folder={folder}
        level={level}
        isSelected={folder.id === selectedFolderId}
        isExpanded={expandedFolders.has(folder.id)}
        onToggle={() => toggleExpanded(folder.id)}
        onSelect={() => onSelectFolder(folder.id)}
        onCreateFolder={onCreateFolder}
        onUpdateFolder={onUpdateFolder}
        onDeleteFolder={onDeleteFolder}
      />
    );
  };

  return (
    <div className="p-4">
      <div className="space-y-1">
        {folderTree.map(folder => renderFolder(folder, 0))}
      </div>
    </div>
  );
};