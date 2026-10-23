/**
 * @fileoverview Customizable Keybindings for Retrograde Descent.
 * Handles storage, defaults, and human-friendly key formatting for both Player 1 and Player 2.
 */

export interface KeyBindings {
  p1Thrust: string;
  p1Left: string;
  p1Right: string;
  p1Reset: string;
  p2Thrust: string;
  p2Left: string;
  p2Right: string;
}

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  p1Thrust: 'KeyW',
  p1Left: 'KeyA',
  p1Right: 'KeyD',
  p1Reset: 'KeyR',
  p2Thrust: 'ArrowUp',
  p2Left: 'ArrowLeft',
  p2Right: 'ArrowRight',
};

const KEYBINDINGS_STORAGE_KEY = 'retrograde_descent_keybindings_v2';

/**
 * Loads keybindings from localStorage with fallback to defaults.
 */
export function getKeybindings(): KeyBindings {
  try {
    const raw = localStorage.getItem(KEYBINDINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_KEYBINDINGS,
        ...parsed,
      };
    }
  } catch {
    // fallback
  }
  return {...DEFAULT_KEYBINDINGS};
}

/**
 * Saves keybindings to localStorage.
 */
export function saveKeybindings(bindings: KeyBindings): void {
  try {
    localStorage.setItem(KEYBINDINGS_STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    // ignore
  }
}

/**
 * Resets keybindings to default values.
 */
export function resetKeybindings(): KeyBindings {
  try {
    localStorage.removeItem(KEYBINDINGS_STORAGE_KEY);
  } catch {
    // ignore
  }
  return {...DEFAULT_KEYBINDINGS};
}

/**
 * Converts keyboard event code or key name to a clean, readable display label.
 */
export function formatKeyDisplay(codeOrKey: string): string {
  if (!codeOrKey) return 'UNBOUND';

  if (codeOrKey.startsWith('Key')) {
    return codeOrKey.substring(3).toUpperCase();
  }
  if (codeOrKey.startsWith('Digit')) {
    return codeOrKey.substring(5);
  }
  if (codeOrKey.startsWith('Numpad')) {
    return `NUM ${codeOrKey.substring(6)}`;
  }

  switch (codeOrKey) {
    case 'ArrowUp':
      return '▲ UP ARROW';
    case 'ArrowDown':
      return '▼ DOWN ARROW';
    case 'ArrowLeft':
      return '◄ LEFT ARROW';
    case 'ArrowRight':
      return '► RIGHT ARROW';
    case 'Space':
      return 'SPACEBAR';
    case 'Enter':
      return 'ENTER';
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'SHIFT';
    case 'ControlLeft':
    case 'ControlRight':
      return 'CTRL';
    case 'AltLeft':
    case 'AltRight':
      return 'ALT';
    case 'Tab':
      return 'TAB';
    case 'Escape':
      return 'ESC';
    default:
      return codeOrKey.toUpperCase();
  }
}
