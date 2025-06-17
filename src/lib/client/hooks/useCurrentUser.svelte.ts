import type { BasicUserInfo, CurrentUserInfo, ServerData } from "$lib/common/sharedTypes";
import { clientDb } from "../db/index.svelte";
import { userTable } from "../db/schema";
import { createHydratableData } from "./localDbHook.svelte";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useCurrentUser = (serverData: ServerData<CurrentUserInfo>) =>
  createHydratableData<CurrentUserInfo, void>(
    {
      key: "current-user",
      query: () =>
        clientDb()
          .select({
            id: userTable.id,
            name: userTable.name,
            email: userTable.email,
            profilePicture: userTable.profilePicture,
          })
          .from(userTable)
          .limit(1)
          .toSQL(),
      transform: ([userData]) =>
        userData
          ? ({
              authenticated: true,
              user: transformKeyToCamelCaseRecursive(
                userData as Record<string, unknown>,
              ) as unknown as BasicUserInfo,
            } as CurrentUserInfo)
          : ({
              authenticated: false,
            } satisfies CurrentUserInfo),
    },
    serverData ?? null,
    undefined,
  );
