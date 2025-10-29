# TypeScript Migration Guide

**Status:** Not Started
**Estimated Effort:** 2-3 weeks
**Priority:** Medium (can be done incrementally)
**Benefits:** Type safety, better IDE support, self-documenting code

---

## Table of Contents

1. [Overview](#overview)
2. [Benefits of TypeScript](#benefits-of-typescript)
3. [Migration Strategy](#migration-strategy)
4. [Setup & Configuration](#setup--configuration)
5. [Migration Steps](#migration-steps)
6. [Type Definitions](#type-definitions)
7. [Common Patterns](#common-patterns)
8. [Testing Strategy](#testing-strategy)
9. [Resources](#resources)

---

## Overview

This guide outlines the process for migrating the Clippy Revival codebase from JavaScript to TypeScript. The migration will be done incrementally to minimize disruption.

### Current State
- **Language:** JavaScript (ES6+)
- **Type Checking:** PropTypes for React components
- **LOC:** ~6,500 lines JavaScript
- **Files:** 20+ component files, 5+ utility files

### Target State
- **Language:** TypeScript 5.0+
- **Type Checking:** TypeScript compiler + ESLint
- **Type Coverage:** 90%+ of codebase
- **Strict Mode:** Enabled

---

## Benefits of TypeScript

### Development Benefits
1. **Compile-Time Type Checking** - Catch errors before runtime
2. **Better IDE Support** - Autocomplete, refactoring, navigation
3. **Self-Documenting Code** - Types serve as inline documentation
4. **Safer Refactoring** - TypeScript catches breaking changes
5. **Better Team Collaboration** - Clear interfaces and contracts

### Maintenance Benefits
1. **Fewer Runtime Errors** - Type errors caught during compilation
2. **Easier Onboarding** - Types make code easier to understand
3. **Better Tooling** - More reliable code analysis and linting
4. **Future-Proof** - Industry standard for large React applications

---

## Migration Strategy

### Approach: Incremental Migration

We'll use a **bottom-up approach**, starting with utilities and working up to components:

```
Phase 1: Setup & Configuration (1-2 days)
Phase 2: Utilities & Services (3-4 days)
Phase 3: Components (5-7 days)
Phase 4: Pages & App (3-4 days)
Phase 5: Cleanup & Strict Mode (2-3 days)
```

### Key Principles
1. **Incremental** - Migrate files one at a time
2. **Non-Breaking** - JavaScript and TypeScript coexist
3. **Bottom-Up** - Start with leaf nodes (utilities, then components, then pages)
4. **Test Coverage** - Ensure tests pass after each file migration
5. **No Big Bang** - Avoid migrating everything at once

---

## Setup & Configuration

### Step 1: Install TypeScript Dependencies

```bash
npm install --save-dev typescript @types/react @types/react-dom @types/node
npm install --save-dev @types/react-router-dom
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Step 2: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false, // Enable after initial migration
    "noImplicitAny": false, // Enable incrementally
    "strictNullChecks": false, // Enable incrementally
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": false,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@pages/*": ["src/pages/*"],
      "@store/*": ["src/store/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build", "backend"]
}
```

### Step 3: Update Webpack Config

```javascript
// webpack.renderer.config.js
module.exports = {
  // ...
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'], // Add .ts and .tsx
    // ...
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript' // Add TypeScript preset
            ]
          }
        }
      },
      // ...
    ]
  }
};
```

### Step 4: Install Babel TypeScript Preset

```bash
npm install --save-dev @babel/preset-typescript
```

### Step 5: Update ESLint Configuration

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "plugins": ["react", "@typescript-eslint"],
  "rules": {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

---

## Migration Steps

### Phase 1: Utilities (Start Here)

Utilities have no dependencies on components, making them ideal starting points.

**Files to Migrate:**
1. `src/utils/storage.js` → `storage.ts`
2. `src/utils/keyboardShortcuts.js` → `keyboardShortcuts.ts`

**Example: storage.ts**

```typescript
// Before (storage.js)
export const getStorageItem = (key, defaultValue = null) => {
  // ...
};

// After (storage.ts)
export const getStorageItem = <T = unknown>(
  key: string,
  defaultValue: T | null = null
): T | null => {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
};

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ACTIVE_CHARACTER: 'active_character',
  // ...
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;
```

### Phase 2: Services

**Files to Migrate:**
1. `src/services/errorHandler.js` → `errorHandler.ts`
2. `src/services/http.js` → `http.ts`
3. `src/services/api.js` → `api.ts`

**Example: errorHandler.ts**

```typescript
interface UserFriendlyError {
  title: string;
  message: string;
}

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  customMessage?: UserFriendlyError | null;
}

export function handleApiError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): UserFriendlyError {
  const {
    showToast = true,
    logError = true,
    customMessage = null
  } = options;

  // Implementation...
}
```

### Phase 3: Components

**Files to Migrate:**
1. `src/components/LoadingSpinner.jsx` → `LoadingSpinner.tsx`
2. `src/components/ErrorBoundary.jsx` → `ErrorBoundary.tsx`
3. `src/components/Toast.jsx` → `Toast.tsx`

**Example: LoadingSpinner.tsx**

```typescript
import React, { FC } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  message,
  size = 40,
  fullScreen = false
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          minHeight: '100vh',
          width: '100%'
        })
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
```

### Phase 4: Store (Zustand)

**File: `src/store/appStore.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    upload: number;
    download: number;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Preferences {
  theme: 'light' | 'dark';
  startOnBoot: boolean;
  showNotifications: boolean;
  aiModel: string;
}

interface AppState {
  // Connection state
  backendUrl: string | null;
  isConnected: boolean;
  websocket: WebSocket | null;

  // Assistant state
  assistantPaused: boolean;
  activeCharacter: string;
  characterState: string;

  // System metrics
  systemMetrics: SystemMetrics;

  // AI chat
  chatHistory: Message[];
  isTyping: boolean;

  // User preferences
  preferences: Preferences;

  // Window positions
  windowPositions: Record<string, { x: number; y: number }>;

  // Actions
  initializeBackend: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearChatHistory: () => void;
  setActiveCharacter: (characterId: string) => void;
  setCharacterState: (state: string) => void;
  updatePreferences: (newPreferences: Partial<Preferences>) => void;
  updateWindowPosition: (window: string, position: { x: number; y: number }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    {
      name: 'clippy-storage',
      partialize: (state) => ({
        activeCharacter: state.activeCharacter,
        chatHistory: state.chatHistory.slice(-50),
        preferences: state.preferences,
        windowPositions: state.windowPositions
      })
    }
  )
);
```

### Phase 5: Enable Strict Mode

After all files are migrated, gradually enable strict mode options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

---

## Type Definitions

### Create Global Type Definitions

**File: `src/types/global.d.ts`**

```typescript
// Electron API types
interface ElectronAPI {
  getBackendUrl: () => Promise<string>;
  showDashboard: () => Promise<void>;
  showBuddy: () => Promise<void>;
  hideBuddy: () => Promise<void>;
  setBuddyClickThrough: (clickThrough: boolean) => Promise<void>;
  selectFile: (options?: FileSelectOptions) => Promise<string[]>;
  selectDirectory: (options?: DirectorySelectOptions) => Promise<string[]>;
  logError: (errorData: ErrorData) => Promise<boolean>;
  onNavigate: (callback: (path: string) => void) => void;
  onAssistantPaused: (callback: (isPaused: boolean) => void) => void;
  getPlatform: () => string;
  getVersion: () => string;
  connectWebSocket: (path: string) => Promise<WebSocket>;
}

interface Window {
  electronAPI: ElectronAPI;
}

interface FileSelectOptions {
  properties?: string[];
  filters?: Array<{ name: string; extensions: string[] }>;
  defaultPath?: string;
}

interface DirectorySelectOptions {
  properties?: string[];
  defaultPath?: string;
}

interface ErrorData {
  type?: string;
  code?: string;
  message: string;
  stack?: string;
  timestamp?: string;
  context?: string;
}
```

**File: `src/types/api.d.ts`**

```typescript
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface SystemInfo {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    upload: number;
    download: number;
  };
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  animations: Record<string, Animation>;
  personality?: Personality;
}

export interface Animation {
  type: 'svg' | 'gif' | 'spritesheet';
  file: string;
  loop?: boolean;
  duration?: number;
}

export interface Personality {
  systemPrompt: string;
  traits: string[];
  greetings: string[];
}
```

---

## Common Patterns

### Pattern 1: React Component with Props

```typescript
import React, { FC, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title: string;
  onClose?: () => void;
}

const MyComponent: FC<Props> = ({ children, title, onClose }) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
      {onClose && <button onClick={onClose}>Close</button>}
    </div>
  );
};

export default MyComponent;
```

### Pattern 2: Event Handlers

```typescript
import React, { FC, ChangeEvent, FormEvent } from 'react';

const Form: FC = () => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" onChange={handleInputChange} />
    </form>
  );
};
```

### Pattern 3: Async Functions

```typescript
async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
}
```

### Pattern 4: Union Types

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';

interface State {
  status: Status;
  data: Data | null;
  error: Error | null;
}
```

---

## Testing Strategy

### Update Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest'
  },
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ]
};
```

### Install Type Definitions for Testing

```bash
npm install --save-dev @types/jest @testing-library/jest-dom
```

---

## Migration Checklist

### Prerequisites
- [ ] TypeScript dependencies installed
- [ ] `tsconfig.json` created
- [ ] Webpack configured for TypeScript
- [ ] ESLint configured for TypeScript
- [ ] Jest configured for TypeScript

### Phase 1: Utilities
- [ ] `src/utils/storage.ts`
- [ ] `src/utils/keyboardShortcuts.ts`

### Phase 2: Services
- [ ] `src/services/errorHandler.ts`
- [ ] `src/services/http.ts`
- [ ] `src/services/api.ts`

### Phase 3: Components
- [ ] `src/components/LoadingSpinner.tsx`
- [ ] `src/components/SkeletonLoader.tsx`
- [ ] `src/components/ErrorBoundary.tsx`
- [ ] `src/components/Toast.tsx`
- [ ] `src/components/KeyboardShortcutsDialog.tsx`

### Phase 4: Pages
- [ ] `src/pages/Dashboard.tsx`
- [ ] `src/pages/BuddyWindow.tsx`
- [ ] `src/pages/Settings.tsx`
- [ ] `src/pages/Characters.tsx`
- [ ] `src/pages/Onboarding.tsx`

### Phase 5: Store
- [ ] `src/store/appStore.ts`

### Phase 6: App
- [ ] `src/App.tsx`
- [ ] `src/index.tsx`

### Phase 7: Strict Mode
- [ ] Enable `noImplicitAny`
- [ ] Enable `strictNullChecks`
- [ ] Enable full `strict` mode
- [ ] Fix all type errors

### Phase 8: Cleanup
- [ ] Remove PropTypes
- [ ] Remove unused `// @ts-ignore` comments
- [ ] Update documentation
- [ ] Verify all tests pass

---

## Resources

### Official Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Tools
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)

### Migration Guides
- [TypeScript Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [React + TypeScript](https://react-typescript-cheatsheet.netlify.app/docs/basic/setup)

---

## Conclusion

TypeScript migration is a significant but worthwhile investment. By following this incremental approach, you can migrate the codebase gradually without disrupting development.

**Estimated Timeline:**
- Setup & Configuration: 1-2 days
- Utilities & Services: 3-4 days
- Components: 5-7 days
- Pages & App: 3-4 days
- Strict Mode & Cleanup: 2-3 days

**Total: 2-3 weeks** (depending on team size and existing workload)

**Next Steps:**
1. Review this guide with the team
2. Schedule migration kickoff
3. Start with Phase 1 (Utilities)
4. Migrate incrementally
5. Enable strict mode gradually
6. Celebrate! 🎉
