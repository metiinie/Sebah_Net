import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Keyboard
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useKeyboardShortcuts, getDefaultShortcuts } from '../hooks/useKeyboardShortcuts';
import { NotificationCenter } from './NotificationCenter';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { UnifiedProfile } from './UnifiedProfile';

export const EnhancedHeader = () => {
  const { theme, setTheme } = useTheme();
  const { goToChoice } = usePageNavigation();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts([
    ...getDefaultShortcuts(),
    {
      key: '?',
      action: () => setShowShortcuts(true),
      description: 'Show Keyboard Shortcuts'
    }
  ]);


  const getThemeIcon = () => {
    return theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    return theme === 'light' ? 'Light' : 'Dark';
  };

  return (
    <>
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToChoice}
              className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
              MediaStream
            </motion.button>

            {/* Center Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <div className="relative">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                >
                  {getThemeIcon()}
                </button>
              </div>

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              {/* Notifications */}
              <NotificationCenter />
            </div>

            {/* Unified Profile Component */}
            <UnifiedProfile />
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

    </>
  );
};
