import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import { afterAll, beforeAll } from "vitest";

// export function useDatabaseContainer() {
//   let postgresContainer: StartedPostgreSqlContainer | undefined;

//   beforeAll(async () => {
//     postgresContainer = await new PostgreSqlContainer(
//       "timescale/timescaledb-ha:pg16-all",
//     )
//       .withDatabase("postgres")
//       .withUsername("postgres")
//       .withPassword("password")
//       .withExposedPorts({ container: 5432, host: 5432 })
//       .start();

//     await migrateDatabase(postgresContainer.getConnectionUri());
//   }, 120000);

//   afterAll(async () => {
//     await postgresContainer?.stop();
//   });

//   return () => postgresContainer;
// }

export function useRedisContainer() {
  let redisContainer: StartedRedisContainer | undefined;

  beforeAll(async () => {
    redisContainer = await new RedisContainer("redis:latest")
      .withExposedPorts({ container: 6379, host: 6379 })
      .start();
  });

  afterAll(async () => {
    await redisContainer?.stop();
  });

  return () => redisContainer;
}
