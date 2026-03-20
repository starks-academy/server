# Database Migration Fix - Wallet Authentication Error

## Problem Summary

The application was throwing a 500 Internal Server Error when users tried to authenticate with their wallet:

```
QueryFailedError: relation "users" does not exist
```

This error occurred at `/api/v1/auth/verify` endpoint after the user signed the authentication message.

## Root Cause Analysis

The issue had multiple contributing factors:

### 1. Missing UUID Extension
The initial migration file was trying to use `uuid_generate_v4()` function without first enabling the PostgreSQL UUID extension.

### 2. Migration Files Not Included in Production Build
The NestJS application uses webpack for bundling, which creates a single `dist/main.js` file. However, TypeORM migrations need to be separate `.js` files that can be loaded at runtime. The Dockerfile wasn't copying these migration files to the production container.

### 3. Insufficient Migration Logging
The migration process lacked detailed logging, making it difficult to diagnose why migrations weren't running successfully in production.

### 4. Missing Render Configuration
The application was deployed on Render without a proper `render.yaml` configuration file, which could lead to inconsistent environment variable setup.

## Solutions Implemented

### 1. Fixed Migration File
**File**: `server/libs/database/src/migrations/1700000000000-InitialSchema.ts`

Added UUID extension creation at the beginning of the migration:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // ... rest of migration
}
```

### 2. Updated Dockerfile
**File**: `server/Dockerfile`

Modified the production stage to explicitly copy migration and entity files:

```dockerfile
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy the built application
COPY --from=builder /app/dist ./dist

# Copy migration files (needed for TypeORM migrations)
COPY --from=builder /app/libs/database/src/migrations ./libs/database/src/migrations

# Copy entities (needed for TypeORM)
COPY --from=builder /app/libs/database/src/entities ./libs/database/src/entities

EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### 3. Enhanced Migration Logging
**File**: `server/apps/api/src/main.ts`

Added comprehensive logging to track migration execution:

```typescript
if (process.env.NODE_ENV !== "test") {
  try {
    console.log("🔄 Running database migrations...");
    const dataSource = app.get(getDataSourceToken());
    console.log("📊 DataSource obtained, checking connection...");
    
    if (!dataSource.isInitialized) {
      console.log("⚠️  DataSource not initialized, initializing now...");
      await dataSource.initialize();
    }
    
    console.log("✅ DataSource connected");
    console.log("📋 Checking pending migrations...");
    
    const pendingMigrations = await dataSource.showMigrations();
    console.log(`Found ${pendingMigrations ? 'pending' : 'no'} migrations`);
    
    await dataSource.runMigrations();
    console.log("✅ Database migrations applied successfully");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    process.exit(1);
  }
}
```

### 4. Improved Database Module Configuration
**File**: `server/libs/database/src/database.module.ts`

Added logging to help debug database connection issues:

```typescript
console.log("🔧 Database configuration:", {
  hasUrl: !!dbUrl,
  ssl,
  nodeEnv: process.env.NODE_ENV
});
```

Also set `migrationsRun: false` to ensure migrations are only run through the explicit call in `main.ts`.

### 5. Created Render Configuration
**File**: `server/render.yaml`

Added a comprehensive Render deployment configuration with:
- Proper environment variable setup
- Database connection configuration
- Docker build settings
- Service and database definitions

### 6. Added Migration Show Script
**File**: `server/package.json`

Added a new script to check migration status:

```json
"migration:show": "typeorm-ts-node-commonjs -d apps/api/src/data-source.ts migration:show"
```

## Deployment Steps

After these changes are deployed to Render:

1. **Automatic Redeploy**: Render will detect the changes and automatically rebuild the Docker container
2. **Migration Execution**: On startup, the application will:
   - Connect to the database
   - Check for pending migrations
   - Run the initial schema migration (creating all tables)
   - Start the API server

3. **Verify**: Check the Render logs for:
   ```
   🔄 Running database migrations...
   📊 DataSource obtained, checking connection...
   ✅ DataSource connected
   📋 Checking pending migrations...
   Found pending migrations
   ✅ Database migrations applied successfully
   🚀 Stacks Academy API running on: http://localhost:3001/api/v1
   ```

## Testing the Fix

Once deployed, test the wallet authentication flow:

1. Go to the frontend application
2. Click "Connect Wallet"
3. Select your wallet and connect
4. Sign the authentication message
5. You should now be successfully authenticated without the 500 error

## Database Schema Created

The migration creates the following tables:
- `users` - User accounts with wallet addresses
- `user_progress` - Learning progress tracking
- `quiz_sessions` - AI tutor quiz sessions
- `chat_sessions` - AI tutor chat sessions
- `chat_messages` - Chat message history
- `xp_events` - Experience point events
- `badges` - Available badges
- `user_badges` - User-earned badges
- `certificates` - NFT certificates
- `gallery_projects` - Project showcase
- `project_votes` - Project voting
- `builder_profiles` - Builder directory

## Monitoring

After deployment, monitor the Render logs for:
- Successful database connection
- Migration execution
- Any authentication errors
- Database query performance

## Rollback Plan

If issues persist:
1. Check Render logs for specific error messages
2. Verify DATABASE_URL environment variable is set correctly
3. Manually run migrations using Render shell:
   ```bash
   pnpm run migration:show
   pnpm run migration:run
   ```
4. Check database permissions and SSL settings

## Additional Notes

- The application uses PostgreSQL with SSL enabled for production
- Migrations run automatically on application startup (except in test environment)
- The database connection uses connection pooling for better performance
- All database operations are logged in development mode for debugging
