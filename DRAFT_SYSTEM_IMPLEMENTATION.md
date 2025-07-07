# Draft System Implementation

## Overview

This document describes the comprehensive draft system implementation that allows users to create, manage, and restore drafts while typing in the chat interface. The system includes debounced saving, URL state management, and a complete draft management interface.

## Features Implemented

### 1. **Automatic Draft Creation**
- Drafts are automatically created when users start typing (no chat context)
- Debounced saving every 1 second to avoid excessive API calls
- No draft is created when users are in an existing chat conversation

### 2. **URL State Management**
- Draft ID is stored in the URL query parameter `?draft=<uuid>`
- State is preserved when reloading the page
- Automatically loads draft content, model settings, and preferences

### 3. **Draft Manager Modal**
- Accessible via a file icon button in the chat input
- Shows all user drafts with preview content
- Displays draft metadata (date, model, settings)
- Individual and bulk delete functionality
- Click to load any draft

### 4. **Database Schema**
- New `drafts` table with comprehensive fields
- User association with foreign key constraints
- Indexed for efficient querying
- Both server and client-side schema support

### 5. **API Routes**
- Complete CRUD operations via v1 API
- `create`, `update`, `list`, `get`, `delete`, `deleteAll`
- Proper authentication and authorization
- Error handling and validation

## Implementation Details

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS "drafts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "title" text,
    "content" text NOT NULL,
    "selected_model" varchar(50) NOT NULL,
    "reasoning_level" varchar(50) DEFAULT 'none' NOT NULL,
    "web_search_enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
```

### API Endpoints

- `POST /api/v1/draft/create` - Create new draft
- `PUT /api/v1/draft/update` - Update existing draft
- `GET /api/v1/draft/list` - List user drafts
- `GET /api/v1/draft/get` - Get specific draft
- `DELETE /api/v1/draft/delete` - Delete specific draft  
- `DELETE /api/v1/draft/deleteAll` - Delete all user drafts

### Key Components

1. **Draft Schema** (`src/lib/common/schema/drafts.ts`)
   - Defines table structure for both client and server
   - Type exports for TypeScript integration

2. **Server Schema** (`src/lib/server/db/schema/drafts.ts`)
   - Server-side table definition with foreign keys

3. **Client Schema** (`src/lib/client/db/schema.ts`)
   - Client-side table for local synchronization

4. **API Router** (`src/lib/server/orpc/routes/v1/draft.ts`)
   - Complete CRUD operations
   - Authentication middleware
   - Input validation

5. **Draft Manager Component** (`src/lib/components/drafts/DraftManager.svelte`)
   - Modal interface for draft management
   - Draft listing with metadata
   - Delete functionality

6. **Enhanced Chat Input** (`src/lib/components/chatInput/ChatMessageInput.svelte`)
   - Integrated draft saving with debouncing
   - URL state management
   - Draft loading and clearing

7. **Utility Functions** (`src/lib/utils/debounce.ts`)
   - Debounce utility for optimized saving

### Migrations

- **Server Migration**: `drizzle/0010_drafts_table.sql`
- **Client Migration**: Auto-generated client-side migration

## User Experience

### Creating Drafts
1. User starts typing in the chat input (when not in an existing chat)
2. After 1 second of inactivity, a draft is automatically created/updated
3. Draft ID is added to the URL for state persistence
4. Subsequent typing updates the existing draft

### Managing Drafts
1. Click the file icon button in the chat input
2. View all drafts with content previews and metadata
3. Click any draft to load it (updates input and URL)
4. Delete individual drafts or all drafts at once

### Loading Drafts
1. Drafts can be loaded from the draft manager
2. URL state is preserved when sharing links with `?draft=<id>`
3. Page reloads automatically restore draft content

### Clearing Drafts
1. Drafts are automatically cleared when messages are sent
2. Users can manually load different drafts
3. URL state is updated accordingly

## Technical Benefits

- **Performance**: Debounced saving prevents API spam
- **UX**: Seamless state management and restoration
- **Data Integrity**: Proper foreign key relationships and indexes
- **Type Safety**: Full TypeScript integration
- **Scalability**: Efficient querying with proper indexing
- **Maintainability**: Clean separation of concerns

## Files Created/Modified

### New Files:
- `src/lib/common/schema/drafts.ts`
- `src/lib/server/db/schema/drafts.ts`
- `src/lib/server/orpc/routes/v1/draft.ts`
- `src/lib/components/drafts/DraftManager.svelte`
- `src/lib/utils/debounce.ts`
- `drizzle/0010_drafts_table.sql`

### Modified Files:
- `src/lib/server/db/schema/index.ts`
- `src/lib/client/db/schema.ts`
- `src/lib/server/orpc/routes/v1/index.ts`
- `src/lib/components/chatInput/ChatMessageInput.svelte`

## Usage Examples

### Loading a Draft via URL
```
https://yourapp.com/?draft=123e4567-e89b-12d3-a456-426614174000
```

### API Usage
```typescript
// Create draft
const draft = await orpc.v1.draft.create({
  content: "Hello world",
  selectedModel: "claude-3-sonnet",
  reasoningLevel: "low",
  webSearchEnabled: true
});

// Load draft
const draft = await orpc.v1.draft.get({ id: draftId });

// List drafts
const drafts = await orpc.v1.draft.list({ limit: 50 });
```

This implementation provides a complete, production-ready draft system that enhances the user experience by preserving work and enabling easy draft management.