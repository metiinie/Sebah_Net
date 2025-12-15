import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, HelpCircle } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Media Player Shortcuts
  { key: 'Space', description: 'Play/Pause', category: 'Media' },
  { key: '←', description: 'Skip back 5 seconds', category: 'Media' },
  { key: '→', description: 'Skip forward 5 seconds', category: 'Media' },
  { key: '↑', description: 'Increase volume', category: 'Media' },
  { key: '↓', description: 'Decrease volume', category: 'Media' },
  { key: 'M', description: 'Mute/Unmute', category: 'Media' },
  { key: 'F', description: 'Toggle fullscreen (video)', category: 'Media' },
  { key: 'S', description: 'Toggle settings', category: 'Media' },

  // Navigation Shortcuts
  { key: 'Ctrl + H', description: 'Go to Home', category: 'Navigation' },
  { key: 'Ctrl + M', description: 'Go to Movies', category: 'Navigation' },
  { key: 'Ctrl + U', description: 'Go to Music', category: 'Navigation' },
  { key: 'Ctrl + P', description: 'Go to Upload', category: 'Navigation' },
  { key: 'Ctrl + A', description: 'Go to Admin', category: 'Navigation' },

  // General Shortcuts
  { key: '/', description: 'Focus search', category: 'General' },
  { key: 'Ctrl + F', description: 'Find/Search', category: 'General' },
  { key: 'Esc', description: 'Close modals', category: 'General' },
  { key: '?', description: 'Show this help', category: 'General' }
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp = ({ isOpen, onClose }: KeyboardShortcutsHelpProps) => {


  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => onClose()} // Use parent handler if needed, or maybe this button effectively opens it? Wait, the parent controls it.
        className="fixed bottom-4 right-4 z-50 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition-colors"
        title="Keyboard Shortcuts (?)"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-8 h-8 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-purple-400 mb-3 border-b border-slate-700 pb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                        >
                          <span className="text-slate-300">{shortcut.description}</span>
                          <kbd className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm font-mono">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>Tip:</strong> Double-tap on video to skip/rewind 5 minutes.
                  Left side rewinds, right side skips forward.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};