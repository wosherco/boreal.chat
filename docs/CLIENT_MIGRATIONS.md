# Client-Side Migrations with PGlite

This project implements a custom client-side migration system for Drizzle ORM with PGlite, allowing migrations to be bundled and run directly in the browser.

## How it Works

The system consists of three main components:

1. **Migration Generation**: Standard Drizzle Kit generates SQL migration files
2. **Migration Compilation**: A script compiles SQL files into a JSON bundle
3. **Client Migration Runner**: A function that applies migrations in the browser

## Usage

### 1. Generate Migrations

When you modify your schema in `src/lib/client/db/schema.ts`, generate migrations:

```bash
npm run db:client:generate
```

This creates SQL migration files in `src/lib/client/db/migrations/`

### 2. Compile Migrations

Compile the SQL migrations into a JSON bundle for the client:

```bash
npm run db:client:compile
```

This creates `src/lib/client/db/deployment.json` with all migrations.

### 3. Build Process

For convenience, you can do both steps at once:

```bash
npm run db:client:build
```

The build process automatically compiles migrations before building the app.

## Automatic Migration Execution

Migrations run automatically when the client database initializes. The system:

- ✅ Creates a `__drizzle_migrations` table to track applied migrations
- ✅ Compares database state with available migrations
- ✅ Applies only new migrations in the correct order
- ✅ Uses transactions to ensure atomicity
- ✅ Provides detailed logging of the migration process

## Migration Files

### SQL Migrations

Generated in `src/lib/client/db/migrations/` with format:

- `0000_migration_name.sql` - The actual SQL statements
- `meta/_journal.json` - Metadata about all migrations

### Compiled Migrations

The compiled `deployment.json` contains:

```json
[
  {
    "idx": 0,
    "when": 1704067200000,
    "tag": "0000_initial_setup",
    "hash": "a1b2c3d4...",
    "sql": ["CREATE TABLE...", "CREATE INDEX..."]
  }
]
```

## Error Handling

The migration system handles common scenarios:

- **No migrations**: Silently continues (fresh database)
- **Missing files**: Logs error and exits compilation
- **Migration failures**: Rolls back transaction and throws error
- **Duplicate migrations**: Skips already-applied migrations

## Development Workflow

1. Modify `src/lib/client/db/schema.ts`
2. Run `npm run db:client:generate`
3. Review generated SQL in `migrations/` folder
4. Run `npm run db:client:compile`
5. Test your changes - migrations apply automatically
6. Commit both schema changes and migration files

## Production Deployment

The `prebuild` script automatically compiles migrations before building:

```bash
npm run build  # Automatically runs db:client:compile first
```

This ensures your production bundle always has the latest migrations.

## Troubleshooting

### "No compiled migrations found"

- Run `npm run db:client:generate` first
- Ensure `migrations/meta/_journal.json` exists
- Check that migration files exist in the migrations folder

### "Migration file not found"

- Ensure all migrations referenced in `_journal.json` have corresponding `.sql` files
- Re-run `npm run db:client:generate` if files are missing

### "Migration failed"

- Check browser console for detailed error messages
- Verify SQL syntax in generated migration files
- Check for conflicting schema changes
