import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';

const AppContent: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        mode={authMode}
        onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
      />
    );
  }

  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-gray-800 dark:text-white',
            }}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;