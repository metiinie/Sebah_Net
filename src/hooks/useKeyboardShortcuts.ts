import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, shiftKey, altKey } = event;
    
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    shortcuts.forEach(shortcut => {
      const keyMatch = key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === ctrlKey;
      const shiftMatch = !!shortcut.shift === shiftKey;
      const altMatch = !!shortcut.alt === altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {};
};

// Predefined shortcuts for common actions
export const getDefaultShortcuts = (): ShortcutConfig[] => [
  {
    key: 'h',
    ctrl: true,
    action: () => window.location.href = '/choice',
    description: 'Go to Home'
  },
  {
    key: 'm',
    ctrl: true,
    action: () => window.location.href = '/movies',
    description: 'Go to Movies'
  },
  {
    key: 'u',
    ctrl: true,
    action: () => window.location.href = '/music',
    description: 'Go to Music'
  },
  {
    key: 'p',
    ctrl: true,
    action: () => window.location.href = '/upload',
    description: 'Go to Upload'
  },
  {
    key: 'a',
    ctrl: true,
    action: () => window.location.href = '/admin',
    description: 'Go to Admin'
  },
  {
    key: '/',
    action: () => {
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Focus Search'
  },
  {
    key: 'Escape',
    action: () => {
      // Close any open modals or dropdowns
      const modals = document.querySelectorAll('[data-modal]');
      modals.forEach(modal => {
        (modal as HTMLElement).style.display = 'none';
      });
    },
    description: 'Close Modals'
  },
  {
    key: 'f',
    ctrl: true,
    action: () => {
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    description: 'Find/Search'
  },
  {
    key: '?',
    action: () => {
      // This will be handled by the KeyboardShortcutsHelp component
      const helpButton = document.querySelector('[title*="Keyboard Shortcuts"]') as HTMLButtonElement;
      if (helpButton) {
        helpButton.click();
      }
    },
    description: 'Show Keyboard Shortcuts Help'
  }
];
