import { sql } from "drizzle-orm";
import { type ClientDBType, type PGliteType } from "./index.svelte";
import { dev } from "$app/environment";

interface Migration {
  idx: number;
  when: number;
  tag: string;
  hash: string;
  sql: string[];
}

export async function migrateClient(db: ClientDBType, pglite: PGliteType): Promise<void> {
  const startTime = performance.now();
  console.log("🔄 Starting client-side migration benchmark...");

  try {
    // Benchmark: Dynamic import
    const importStartTime = performance.now();
    const { default: migrations }: { default: Migration[] } = await import("./deployment.json");
    const importTime = performance.now() - importStartTime;
    console.log(`📦 Migration import took: ${importTime.toFixed(2)}ms`);

    const TABLE_NAME = "__drizzle_migrations";

    // Benchmark: Create migrations table
    const createTableStartTime = performance.now();
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
    const createTableTime = performance.now() - createTableStartTime;
    console.log(`🗃️  Create migrations table took: ${createTableTime.toFixed(2)}ms`);

    // Benchmark: Get last migration
    const getLastStartTime = performance.now();
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
    const getLastTime = performance.now() - getLastStartTime;
    console.log(`🔍 Get last deployment took: ${getLastTime.toFixed(2)}ms`);

    const lastDeployment = deployments.rows[0];

    // Benchmark: Filter migrations
    const filterStartTime = performance.now();
    const migrationsToApply = migrations.filter((migration) => {
      if (!lastDeployment) return true;
      return Number(lastDeployment.created_at) < migration.when;
    });
    const filterTime = performance.now() - filterStartTime;
    console.log(`⚡ Filter migrations took: ${filterTime.toFixed(2)}ms`);

    if (migrationsToApply.length === 0) {
      const totalTime = performance.now() - startTime;
      console.log("✅ Database is up to date - no migrations to apply");
      console.log(`📊 Total migration check took: ${totalTime.toFixed(2)}ms`);
      return;
    }

    console.log(`📦 Applying ${migrationsToApply.length} migration(s)...`);

    // Benchmark: Apply migrations transaction
    const transactionStartTime = performance.now();
    await db.transaction(async (tx) => {
      for (const [index, migration] of migrationsToApply.entries()) {
        const migrationStartTime = performance.now();
        console.log(
          `📝 Applying migration ${index + 1}/${migrationsToApply.length}: ${migration.tag}`,
        );

        // Benchmark: Execute SQL statements
        const sqlExecutionStartTime = performance.now();
        for (const [sqlIndex, sqlStatement] of migration.sql.entries()) {
          if (sqlStatement.trim()) {
            const statementStartTime = performance.now();
            await tx.execute(sql.raw(sqlStatement));
            const statementTime = performance.now() - statementStartTime;
            if (migration.sql.length > 1) {
              console.log(
                `    📄 SQL statement ${sqlIndex + 1}/${migration.sql.length} took: ${statementTime.toFixed(2)}ms`,
              );
            }
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
    const transactionTime = performance.now() - transactionStartTime;
    console.log(`🔄 Transaction execution took: ${transactionTime.toFixed(2)}ms`);

    const totalTime = performance.now() - startTime;
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
    console.log("\n📊 Migration Breakdown:");
    console.log(
      `  Import:              ${importTime.toFixed(2)}ms (${((importTime / totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Create Table:        ${createTableTime.toFixed(2)}ms (${((createTableTime / totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Get Last Deployment: ${getLastTime.toFixed(2)}ms (${((getLastTime / totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Filter Migrations:   ${filterTime.toFixed(2)}ms (${((filterTime / totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Transaction:         ${transactionTime.toFixed(2)}ms (${((transactionTime / totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(`✅ Total migration time: ${totalTime.toFixed(2)}ms`);
  } catch (error) {
    const totalTime = performance.now() - startTime;
    if (error instanceof Error && error.message.includes("Cannot resolve module")) {
      console.log("ℹ️  No compiled migrations found - database is at initial state");
      console.log(`📊 Migration check took: ${totalTime.toFixed(2)}ms`);
      return;
    }

    console.error(`❌ Migration failed after ${totalTime.toFixed(2)}ms:`, error);
    if (!dev) {
      console.log("🔄 Attempting to recover by clearing local database and reloading...");

      try {
        // Import clearLocalDb dynamically to avoid circular dependency
        const { clearLocalDb } = await import("./index.svelte");
        await clearLocalDb();
        window.location.reload();
      } catch (recoveryError) {
        console.error("❌ Recovery attempt failed:", recoveryError);
        throw error; // Re-throw original error if recovery fails
      }
    } else {
      throw error;
    }
  }
}
