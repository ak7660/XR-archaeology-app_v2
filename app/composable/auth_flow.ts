/** Leaving the sign-in screens.
 *
 * Sign-in, sign-up, email confirmation and password reset are pushed on the
 * root stack above the tabs. Finishing any of them pops all of them at once,
 * so the person lands back where they started - the event they wanted to book,
 * the trip planner, the Account tab - instead of the home screen.
 */
import { router, useNavigation } from "expo-router";
import { StackActions } from "@react-navigation/native";

export function useLeaveAuthFlow() {
  const navigation = useNavigation();
  return () => {
    const state: any = navigation.getState?.();
    const count = (state?.routes ?? []).filter((r: any) => String(r.name).startsWith("(auth)")).length;
    if (count > 0 && count < (state?.routes?.length ?? 0)) {
      navigation.dispatch(StackActions.pop(count));
    } else {
      router.replace("/");
    }
  };
}
