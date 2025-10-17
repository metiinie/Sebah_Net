import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  Monitor, 
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
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      case 'auto': return <Monitor className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'auto': return 'Auto';
    }
  };

  return (
    <>
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToChoice}
              className="flex items-center gap-2 text-white font-bold text-xl"
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
                  onClick={() => {
                    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
                    const currentIndex = themes.indexOf(theme);
                    const nextIndex = (currentIndex + 1) % themes.length;
                    setTheme(themes[nextIndex]);
                  }}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                  title={`Current theme: ${getThemeLabel()}`}
                >
                  {getThemeIcon()}
                </button>
              </div>

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
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
