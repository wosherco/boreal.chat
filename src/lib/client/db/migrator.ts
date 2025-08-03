import { sql } from "drizzle-orm";
import { dev } from "$app/environment";
import type { CommonDBClient, PGliteType } from "./LocalDatabase.svelte";
import { resetDatabaseInstance } from "./index.svelte";

interface Migration {
  idx: number;
  when: number;
  tag: string;
  hash: string;
  sql: string[];
}

export async function migrateClient(db: CommonDBClient, pglite: PGliteType): Promise<void> {
  try {
    const { default: migrations }: { default: Migration[] } = await import("./deployment.json");

    const TABLE_NAME = "__drizzle_migrations";

    // Create migrations table
    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(TABLE_NAME)} (
          id SERIAL PRIMARY KEY,
          hash TEXT NOT NULL,
          tag TEXT NOT NULL,
          created_at BIGINT NOT NULL
        );
      `,
    );

    // Get last deployment
    const deployments = await db.execute<{
      id: number;
      hash: string;
      created_at: string;
    }>(
      sql`
        SELECT id, hash, created_at 
        FROM ${sql.identifier(TABLE_NAME)} 
        ORDER BY created_at DESC 
        LIMIT 1;
      `,
    );

    const lastDeployment = deployments.rows[0];

    // Filter migrations
    const migrationsToApply = migrations.filter((migration) => {
      if (!lastDeployment) return true;
      return Number(lastDeployment.created_at) < migration.when;
    });

    if (migrationsToApply.length === 0) {
      console.log("✅ Database is up to date - no migrations to apply");
      return;
    }

    console.log(`📦 Applying ${migrationsToApply.length} migration(s)...`);

    // Apply migrations transaction
    await db.transaction(async (tx) => {
      for (const [index, migration] of migrationsToApply.entries()) {
        const migrationStartTime = performance.now();
        console.log(
          `📝 Applying migration ${index + 1}/${migrationsToApply.length}: ${migration.tag}`,
        );

        // Execute SQL statements
        const sqlExecutionStartTime = performance.now();
        for (const sqlStatement of migration.sql) {
          if (sqlStatement.trim()) {
            await tx.execute(sql.raw(sqlStatement));
          }
        }
        const sqlExecutionTime = performance.now() - sqlExecutionStartTime;

        // Benchmark: Record migration
        const recordStartTime = performance.now();
        await tx.execute(
          sql`
            INSERT INTO ${sql.identifier(TABLE_NAME)} (hash, created_at, tag) 
            VALUES (${migration.hash}, ${migration.when}, ${migration.tag});
          `,
        );
        const recordTime = performance.now() - recordStartTime;

        const migrationTime = performance.now() - migrationStartTime;
        console.log(`  ✅ Applied: ${migration.tag} (hash: ${migration.hash.substring(0, 8)}...)`);
        console.log(
          `  ⏱️  Migration timing - SQL: ${sqlExecutionTime.toFixed(2)}ms, Record: ${recordTime.toFixed(2)}ms, Total: ${migrationTime.toFixed(2)}ms`,
        );
      }
    });

    console.log("🎉 All migrations applied successfully!");

    console.log("🔃 Syncing into IndexedDB...");
    await pglite
      .syncToFs()
      .then(() => {
        console.log("✅ IndexedDB synced successfully!");
      })
      .catch((error) => {
        console.error("❌ IndexedDB sync failed:", error);
      });

    // Summary breakdown
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot resolve module")) {
      console.log("ℹ️  No compiled migrations found - database is at initial state");
      return;
    }

    console.error(`❌ Migration failed:`, error);
    if (!dev) {
      console.log("🔄 Attempting to recover by clearing local database and reloading...");

      try {
        await resetDatabaseInstance();
      } catch (recoveryError) {
        console.error("❌ Recovery attempt failed:", recoveryError);
        throw error;
      }
    } else {
      throw error;
    }
  }
}
