#!/usr/bin/env node

/**
 * This script compiles the Drizzle migrations into a format that can be processed by the client
 * This allows for migrations to be shipped and ran within the application using PGlite
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const root = path.resolve(url.fileURLToPath(path.dirname(import.meta.url)), "..");
const journalPath = path.resolve(root, "src/lib/client/db/migrations/meta/_journal.json");
const migrationsDir = path.resolve(root, "src/lib/client/db/migrations");
const outputDir = path.resolve(root, "src/lib/client/db");
const outputFile = path.resolve(outputDir, "deployment.json");

console.log("🔄 Compiling client-side migrations...");

// Check if journal file exists
if (!fs.existsSync(journalPath)) {
  console.log("⚠️  No journal file found. Run migrations generation first.");
  console.log("   Run: npm run db:client:generate");
  process.exit(0);
}

// Read the journal file
const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));

const compiledMigrations = [];

for (let index = 0; index < journal.entries.length; index++) {
  const { when, idx, tag } = journal.entries[index];

  console.log(`📝 Parsing migration (${index + 1}/${journal.entries.length}): ${tag}`);

  const migrationFilePath = path.resolve(migrationsDir, `${tag}.sql`);

  if (!fs.existsSync(migrationFilePath)) {
    console.error(`❌ Migration file not found: ${migrationFilePath}`);
    process.exit(1);
  }

  const migrationFile = fs.readFileSync(migrationFilePath, "utf8");

  // Create hash of the migration content
  const hash = crypto.createHash("sha256").update(migrationFile).digest("hex");

  // Split SQL statements by the statement breakpoint
  const sqlStatements = migrationFile
    .replace(/\n\t?/g, "")
    .split("--> statement-breakpoint")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  compiledMigrations.push({
    idx,
    when,
    tag,
    hash,
    sql: sqlStatements,
  });
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the compiled migrations
fs.writeFileSync(outputFile, JSON.stringify(compiledMigrations, null, 2));

console.log(`✅ Successfully compiled ${compiledMigrations.length} migrations to ${outputFile}`);
console.log("🎉 Migration compilation complete!");
