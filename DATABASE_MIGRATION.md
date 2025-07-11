# Database Migration Guide

## Current State: Dual Database System

Your app currently has both SQLite (local) and Supabase (cloud) implementations, which can cause confusion and data inconsistency.

### Current Database Files:
- `src/database/database.js` - SQLite operations (384 lines)
- `src/utils/supabase.js` - Supabase operations (171 lines)
- `supabase-schema.sql` - Supabase database schema

## Migration Strategy: Supabase-Only

### Phase 1: Remove SQLite Dependencies

1. **Remove SQLite package**:
   ```bash
   npm uninstall react-native-sqlite-storage
   ```

2. **Update App.tsx** (Already done):
   - Removed `recreateUsersTable` import and call
   - Simplified database initialization

3. **Remove SQLite database file**:
   - Delete or rename `src/database/database.js` to `src/database/database.js.backup`

### Phase 2: Update All Database Operations

All database operations should use Supabase instead of SQLite:

#### Authentication:
- ✅ Already using Supabase Auth
- ✅ AuthContext properly configured

#### Products:
- ✅ `db.getProducts()` - Supabase
- ✅ `db.addProduct()` - Supabase
- ✅ `db.updateProduct()` - Supabase
- ✅ `db.deleteProduct()` - Supabase

#### Sales:
- ✅ `db.addSale()` - Supabase
- ✅ `db.getSales()` - Supabase

### Phase 3: Clean Up Imports

Remove SQLite imports from all files:

```javascript
// Remove this import from App.tsx
import { initDB, getDBConnection } from './src/database/database';

// Keep only Supabase imports
import { db, storage } from '../utils/supabase';
```

### Phase 4: Update App.tsx

```javascript
import 'react-native-gesture-handler';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
```

## Benefits of Supabase-Only Approach

✅ **Data Consistency**: Single source of truth  
✅ **Real-time Updates**: Built-in real-time subscriptions  
✅ **Offline Support**: Supabase has offline capabilities  
✅ **Scalability**: PostgreSQL is more scalable than SQLite  
✅ **Backup & Recovery**: Automatic backups  
✅ **Multi-device Sync**: Data syncs across all devices  

## Migration Checklist

- [x] Remove database migration warning from App.tsx
- [ ] Remove SQLite package from package.json
- [ ] Delete/backup src/database/database.js
- [ ] Update App.tsx to remove SQLite initialization
- [ ] Test all database operations with Supabase
- [ ] Verify authentication flow
- [ ] Test product management
- [ ] Test sales tracking
- [ ] Test image upload (after storage bucket setup)

## Testing After Migration

1. **Authentication**: Sign up, login, logout
2. **Products**: Add, edit, delete products
3. **Sales**: Record sales and view history
4. **Images**: Upload product images (after storage setup)
5. **Data Persistence**: Verify data persists across app restarts 