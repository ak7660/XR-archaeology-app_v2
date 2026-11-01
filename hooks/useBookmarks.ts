/** Saved places and the AR collection.
 *
 * Two lists live on the account (XR-archaeology-server `server/db/user.ts`):
 * `bookmarks` holds places - attractions, restaurants, lodgings - and
 * `collections` holds 3D artifacts found in augmented reality.
 *
 * Both work without an account: what a guest saves stays on the phone and is
 * merged into their account when they sign in (providers/auth_provider.tsx).
 */
import { useCallback } from "react";
import { useAuth } from "@/providers/auth_provider";

type List = "bookmarks" | "collections";

function useSavedList(list: List) {
  const { user, updateUser } = useAuth();
  const ids: string[] = (user?.[list] as string[] | undefined) ?? [];

  const isSaved = useCallback((id?: string) => !!id && ids.includes(id), [ids]);

  /** Adds or removes an id and reports whether it is saved afterwards. */
  const toggle = useCallback(
    async (id?: string): Promise<boolean> => {
      if (!id) return false;
      const saving = !ids.includes(id);
      const next = saving ? [...ids, id] : ids.filter((it) => it !== id);
      await updateUser({ [list]: next });
      return saving;
    },
    [ids, updateUser],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!ids.includes(id)) return;
      await updateUser({ [list]: ids.filter((it) => it !== id) });
    },
    [ids, updateUser],
  );

  return { ids, isSaved, toggle, remove };
}

/** Places the person saved with the bookmark button. */
export function useBookmarks() {
  return useSavedList("bookmarks");
}

/** 3D artifacts the person saved from augmented reality. */
export function useCollection() {
  return useSavedList("collections");
}
