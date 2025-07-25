import type { UserInfo } from "../sharedTypes";

export function isAnonymousUser(user: Pick<UserInfo, "role">) {
  return user.role === "ANONYMOUS";
}
