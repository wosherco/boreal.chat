import type { CurrentUserInfo, ServerData, UserInfo } from "$lib/common/sharedTypes";
import { clientDb } from "../db/index.svelte";
import { userTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
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
            subscribedUntil: userTable.subscribedUntil,
            subscriptionStatus: userTable.subscriptionStatus,
            subscriptionPlan: userTable.subscriptionPlan,
          })
          .from(userTable)
          .limit(1)
          .toSQL(),
      transform: ([userData]) => ({
        authenticated: userData ? true : false,
        data: userData
          ? (transformKeyToCamelCaseRecursive(
              userData as Record<string, unknown>,
            ) as unknown as UserInfo)
          : null,
      }),
    },
    serverData ?? null,
    undefined,
  );
