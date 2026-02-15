# Layered Architecture

This project follows a **three-layer architecture** pattern with a shared library, ensuring clear separation of concerns and maintainability.

## Architecture Diagram

```
┌─────────────────────────────────────┐
│  UI Layer (/components)             │
│  - React components                 │
│  - Visual presentation              │
│  - User interactions                │
└──────────────┬──────────────────────┘
               │ uses
┌──────────────▼──────────────────────┐
│  State Layer (/state)               │
│  - Business logic                   │
│  - Data management                  │
│  - Custom hooks (useNotes, etc.)    │
└──────────────┬──────────────────────┘
               │ uses
┌──────────────▼──────────────────────┐
│  Adapter Layer (/adapters)          │
│  - External dependencies            │
│  - Storage operations               │
│  - DOM manipulation                 │
│  - File I/O operations              │
└─────────────────────────────────────┘

▼▼▼ Shared Libraries (across all layers) ▼▼▼
┌─────────────────────────────────────┐
│  /utils    - Utility functions      │
│  /hooks    - Custom React hooks     │
│  /types    - TypeScript interfaces  │
└─────────────────────────────────────┘
```

## Layer Responsibilities

### 1. UI Layer (`/components`)

**Purpose**: Presentation and user interaction  
**What goes here**:

- React components (layout, widgets, UI elements)
- Component styling and animations
- User event handlers (initial handling)
- Props and component composition

**What NOT to do**:

- Don't make direct API/storage calls
- Don't contain business logic
- Don't directly manipulate localStorage

**Example files**:

- `components/widgets/notes.tsx` - Note display component
- `components/layout/navbar.tsx` - Navigation bar
- `components/ui/button.tsx` - Reusable UI elements

### 2. State Layer (`/state`)

**Purpose**: Business logic and data management  
**What goes here**:

- Custom React hooks (useNotes, useSettings, useLayout)
- State management logic (useState, useCallback)
- Data transformations
- Business rules and workflows

**What NOT to do**:

- Don't directly read/write to localStorage
- Don't call DOM APIs directly (use adapters)
- Don't contain JSX or component rendering

**Example files**:

- `state/use-notes.ts` - Notes CRUD logic
- `state/use-settings.ts` - Settings management
- `state/use-layout.ts` - Layout state management

### 3. Adapter Layer (`/adapters`)

**Purpose**: External dependencies and side effects  
**What goes here**:

- Storage operations (localStorage)
- DOM manipulation (theme, density, CSS classes)
- File I/O (import/export)
- Any external service integrations

**What NOT to do**:

- Don't contain business logic
- Don't know about React components
- Don't expose implementation details

**Example files**:

- `adapters/storage.adapter.ts` - Generic storage operations
- `adapters/notes.adapter.ts` - Note persistence
- `adapters/settings.adapter.ts` - Settings/layout/shortcuts persistence
- `adapters/dom.adapter.ts` - DOM manipulation (theme, export)

## Shared Libraries

These folders are accessible from **any layer** and should contain stable, reusable code:

### `/utils`

**Purpose**: Pure utility functions  
**Contains**:

- Helper functions (string formatting, date calculations, etc.)
- Constants and configurations
- Shared algorithms

**Rules**:

- Functions should be pure (no side effects)
- Can be used by adapters, state, or components
- Low dependency coupling

### `/hooks`

**Purpose**: Custom React hooks (non-state related)  
**Contains**:

- `use-dialog-state.ts` - Dialog state management
- `use-resizable.ts` - Resize handling

**Rules**:

- Hooks can use React APIs
- Should be composable
- Can be used by components and state layer

### `/types`

**Purpose**: Shared TypeScript interfaces and types  
**Contains**:

- `notes.ts` - Note type definitions
- `settings.ts` - Settings type definitions
- `shortcuts.ts` - Shortcut type definitions

**Rules**:

- Types should be framework-agnostic
- Can be imported anywhere
- Document complex types with JSDoc

## Data Flow Example: Adding a Note

```
User clicks "Add Note" button
    ↓
Component (notes.tsx) triggers handler
    ↓
State layer (useNotes.addNote) processes logic
    ↓
Adapter layer (notesAdapter.save) persists to storage
    ↓
Component re-renders with updated data
```

## Dependency Flow

```
Components → State → Adapters
    ↑_________↑
   (can use shared libs)
```

**✅ ALLOWED**:

- Components → State
- State → Adapters
- Adapters → Utils/Types
- Any layer → Hooks/Types/Utils

**❌ FORBIDDEN**:

- Adapters → State
- Adapters → Components
- State → Components (except through props)
- Components → Adapters directly

## Migration Guide: Using Adapters

### Before (Old Pattern)

```typescript
// Old: Direct storage calls
import { loadNotes, saveNotes } from '~/utils/settings';

const loadNotes = () => {
  const stored = localStorage.getItem('key');
  return stored ? JSON.parse(stored) : [];
};
```

### After (New Pattern)

```typescript
// New: Using adapters
import { notesAdapter } from '~/adapters';

const notes = notesAdapter.load();
notesAdapter.save(notes);
```

## Testing Strategy

### Unit Testing

- **State layer**: Test business logic in isolation

  ```typescript
  const { addNote } = useNotes();
  addNote('Test', 'Content');
  // Assert logic without storage
  ```

- **Adapters**: Mock localStorage
  ```typescript
  jest.mock('~/adapters/storage.adapter');
  // Test adapter logic
  ```

### Integration Testing

- Test state → adapter interaction
- Verify data persistence workflows

### Component Testing

- Test UI rendering with mock state hooks
- Verify user interactions trigger state updates

## Adding New Features

1. **Define types** in `/types`
2. **Create adapter** in `/adapters` for persistence
3. **Create state hook** in `/state` for business logic
4. **Create components** in `/components` for UI
5. **Wire together** in parent component

## Benefits of This Architecture

✅ **Separation of Concerns**: Each layer has a single responsibility  
✅ **Testability**: Layers can be tested independently  
✅ **Maintainability**: Changes isolated to relevant layer  
✅ **Scalability**: Easy to add new features or replace implementations  
✅ **Reusability**: Shared libraries prevent code duplication  
✅ **Type Safety**: Clear interfaces between layers

## When to Refactor

- **Components growing too large** → Extract state to custom hook
- **State logic getting complex** → Consider splitting into multiple hooks
- **Duplicated storage code** → Move to adapter pattern
- **Business logic in components** → Extract to state layer
