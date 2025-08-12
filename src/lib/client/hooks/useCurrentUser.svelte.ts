import type { CurrentUserInfo, ServerDataGetter, UserInfo } from "$lib/common/sharedTypes";
import { isAnonymousUser } from "$lib/common/utils/anonymous";
import { userTable } from "../db/schema";
import { transformKeyToCamelCaseRecursive } from "./utils";
import { HydratableQuery } from "../db/HydratableQuery.svelte";

export const createCurrentUser = (serverData: ServerDataGetter<CurrentUserInfo>) =>
  new HydratableQuery<CurrentUserInfo>(
    (db) =>
      db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
          profilePicture: userTable.profilePicture,
          emailVerified: userTable.emailVerified,
          subscribedUntil: userTable.subscribedUntil,
          subscriptionStatus: userTable.subscriptionStatus,
          subscriptionPlan: userTable.subscriptionPlan,
        })
        .from(userTable)
        .limit(1)
        .toSQL(),
    ([userData]) => ({
      authenticated: userData ? !isAnonymousUser(userData as UserInfo) : false,
      data: userData
        ? (transformKeyToCamelCaseRecursive(
            userData as Record<string, unknown>,
          ) as unknown as UserInfo)
        : null,
    }),
    serverData,
  );
