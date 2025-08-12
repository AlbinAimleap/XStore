import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  Search,
  LogOut,
  Star,
  Plus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  onShowFrequent?: () => void;
  onCreateItem?: () => void;
  sidebarContent?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onSearch,
  onShowFrequent,
  onCreateItem,
  sidebarContent 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : -320,
        }}
        className="fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-lg lg:relative lg:translate-x-0 lg:shadow-none"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                XStore
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Secure Vault
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <button
                onClick={onCreateItem}
                className="w-full flex items-center space-x-3 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Item</span>
              </button>
              
              <button
                onClick={onShowFrequent}
                className="w-full flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
              >
                <Star className="w-5 h-5" />
                <span className="font-medium">Frequently Used</span>
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      </motion.div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>

              {/* Search */}
              {onSearch && (
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="pl-10 pr-4 py-2 w-80 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </form>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            >
              {mode === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};