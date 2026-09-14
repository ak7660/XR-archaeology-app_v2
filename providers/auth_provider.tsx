import { User } from "@/models";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useFeathers } from "./feathers_provider";
import { useLanguage } from "./language_provider";
import _ from "lodash";

/**
 * Who is using the app.
 *
 * A guest has a `user` without `_id`: favourites and the AR collection live only
 * on the phone. Signing in (or signing up) merges them into the account, which
 * then keeps them on the server (XR-archaeology-server `users` on the public API).
 */
class AuthState {
  user?: User;
  token?: string;
}

interface AuthProps {
  email: string;
  password: string;
  strategy?: string;
}
interface AuthRequest {
  strategy: string;
  [key: string]: any;
}

class AuthContext {
  readonly user?: User;
  /** Stored sign-in state has been read; until then, don't decide what to show. */
  readonly ready: boolean;
  /** The person chose "Continue as guest" on the start screen. */
  readonly guestChosen: boolean;
  continueAsGuest: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  login: (props: AuthProps) => Promise<void>;
  logout: () => Promise<boolean>;
  register: (user: Partial<User>) => Promise<void>;
  /** Confirm the email address with the emailed 6-digit code. */
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  /** Email a password-reset code. Answers the same whether or not the email has an account. */
  forgotPassword: (email: string) => Promise<void>;
  /** Set a new password with the emailed code, then sign in with it. */
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, password: string) => Promise<void>;
  /** Delete the account and everything it owns, then continue as a guest. */
  deleteAccount: () => Promise<void>;
}

const AuthStore = createContext<AuthContext | null>(null);

interface Props {
  children: React.ReactNode;
  /** Function called when the app has no user */
  fallback?: () => void;
}

const localStorageKey = "authState";
/** Remembers "Continue as guest", so the start screen isn't shown on every launch. */
const guestChoiceKey = "welcomeChoice";

/** The session is over (password changed elsewhere, account deleted, token expired). */
function isSessionEnded(error: any) {
  return error?.code === 401 || error?.name === "NotAuthenticated";
}

/** Someone using the app without an account: what they save stays on the phone. */
function guestUser(bookmarks: string[] = [], collections: string[] = []): User {
  return Object.assign(new User(), { bookmarks, collections });
}

/** Items in `extra` that `base` lacks, appended in order. */
function union(base: string[] = [], extra: string[] = []) {
  return _.uniq([...base, ...extra].map(String));
}

export function AuthProvider({ children }: Props) {
  const feathers = useFeathers();
  const { language } = useLanguage();
  const [state, setState] = useState<AuthState>(() => new AuthState());
  const [ready, setReady] = useState(false);
  const [guestChosen, setGuestChosen] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const authPromise = useRef<Promise<void | null> | null>(null);
  const authenticated = useRef(false);
  const loaded = useRef(false);

  useEffect(() => {
    async function init() {
      handleFeathers();
      const stored = await fromStorage();
      if (stored) setState(stored);
      else setState({ user: guestUser() });
      try {
        setGuestChosen((await SecureStore.getItemAsync(guestChoiceKey)) === "guest");
      } catch {}
      loaded.current = true;
      setReady(true);
      if (stored?.token) {
        // Refresh the account from the server; also catches a session ended elsewhere.
        await reAuthentication(true, stored.token).catch(() => {});
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (loaded.current) localSave(state);
  }, [state]);

  // Keep the account's language in step with the app, so emails arrive in it.
  useEffect(() => {
    const user = stateRef.current.user;
    if (user?._id && stateRef.current.token && user.language !== language) {
      feathers
        .service("users")
        .patch(user._id, { language })
        .then((u: User) => setState((s) => ({ ...s, user: u })))
        .catch(() => {});
    }
  }, [language, state.user?._id]);

  async function localSave(value: AuthState): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(localStorageKey, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  async function localDelete(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(localStorageKey);
      return true;
    } catch {
      return false;
    }
  }
  async function fromStorage(): Promise<AuthState | undefined> {
    try {
      const res = await SecureStore.getItemAsync(localStorageKey);
      if (res) return JSON.parse(res);
    } catch (error) {
      console.warn("Cannot get from local storage", error);
    }
  }

  /** Drop the session but keep what the person saved, so they carry on as a guest. */
  function endSession(keepSaved = true) {
    authenticated.current = false;
    authPromise.current = null;
    const user = stateRef.current.user;
    setState({
      user: guestUser(keepSaved ? user?.bookmarks : [], keepSaved ? user?.collections : []),
    });
  }

  const updateUser = useCallback(
    async (changes: Partial<User>) => {
      changes = _.omit(changes, ["_id", "createdAt", "email", "password", "verified"]);
      const { user, token } = stateRef.current;
      if (user?._id && token) {
        const updated: User = await feathers.service("users").patch(user._id, changes);
        setState((s) => ({ ...s, user: updated }));
      } else {
        setState((s) => ({ ...s, user: { ...(s.user as User), ...changes } }));
      }
    },
    [feathers]
  );

  function handleFeathers() {
    if (feathers.io) {
      feathers.io.on("disconnect", () => {
        const promise = new Promise((resolve) => feathers.io!.once("connect", () => resolve(undefined))).then(() =>
          authenticated.current ? reAuthentication(true).catch(() => {}) : null
        );
        authPromise.current = promise;
      });
    }

    feathers.post = async function (url: string, data: any, params: any) {
      const accessToken = stateRef.current.token ?? (await fromStorage())?.token;
      return fetch(`${feathers.apiURL}/${url}`, {
        method: "POST",
        body: data,
        ...params,
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(params?.headers || {}),
        },
      });
    };

    feathers.hooks({
      before: {
        async all(hook) {
          if (hook.path === "authentication" || hook.params?.noAuthCheck) return;
          if (!authenticated.current) {
            await reAuthentication().catch(() => {});
          }
        },
      },
    });
  }

  /** Authenticate the socket and adopt the account the server returns. */
  const authentication = useCallback(
    async (req: AuthRequest) => {
      const promise = feathers
        .service("authentication")
        .create(req)
        .then((res: any) => {
          authenticated.current = true;
          setState({ token: res.accessToken, user: res.user });
        });
      authPromise.current = promise;
      return promise;
    },
    [feathers]
  );

  const reAuthentication = async (force: boolean = false, token?: string) => {
    if (!authPromise.current || force) {
      const oldToken = token ?? stateRef.current.token ?? (await fromStorage())?.token;
      if (!oldToken) return;
      try {
        await authentication({ strategy: "jwt", accessToken: oldToken });
      } catch (error) {
        if (isSessionEnded(error)) endSession();
        throw error;
      }
      return;
    }
    return authPromise.current;
  };

  /** Bring favourites saved as a guest into the account that just signed in. */
  async function mergeGuestData(guest: User | undefined) {
    if (!guest || guest._id) return;
    const { user } = stateRef.current;
    if (!user?._id) return;
    const bookmarks = union(user.bookmarks, guest.bookmarks);
    const collections = union(user.collections, guest.collections);
    if (bookmarks.length === (user.bookmarks?.length ?? 0) && collections.length === (user.collections?.length ?? 0)) return;
    try {
      const updated: User = await feathers.service("users").patch(user._id, { bookmarks, collections });
      setState((s) => ({ ...s, user: updated }));
    } catch (error) {
      console.warn("Could not merge guest favourites", error);
    }
  }

  const login = useCallback(
    async function login({ strategy = "local", email, password }: AuthProps) {
      const guest = stateRef.current.user;
      await authentication({ strategy, email: email.trim(), password });
      await mergeGuestData(guest);
    },
    [authentication]
  );

  async function continueAsGuest() {
    setGuestChosen(true);
    try {
      await SecureStore.setItemAsync(guestChoiceKey, "guest");
    } catch {}
  }

  /** After signing out or deleting the account, the start screen comes back next launch. */
  async function forgetGuestChoice() {
    setGuestChosen(false);
    try {
      await SecureStore.deleteItemAsync(guestChoiceKey);
    } catch {}
  }

  async function register(newUser: Partial<User>) {
    const guest = stateRef.current.user;
    await feathers.service("users").create({
      ...newUser,
      language,
      bookmarks: guest?._id ? [] : guest?.bookmarks ?? [],
      collections: guest?._id ? [] : guest?.collections ?? [],
    });
  }

  const logout = useCallback(
    async function logout() {
      let authRes: any = true;
      try {
        authRes = await feathers.service("authentication").remove(null);
      } catch (error) {
        console.warn("logout", error);
      }
      authPromise.current = null;
      authenticated.current = false;
      setState({ user: guestUser() });
      await forgetGuestChoice();
      const deleteSuccess = await localDelete();
      return !!authRes && deleteSuccess;
    },
    [feathers]
  );

  async function verifyEmail(code: string) {
    const res = await feathers.service("account").create({ action: "verifyEmail", code: code.replace(/\s+/g, "") });
    if (res?.user) setState((s) => ({ ...s, user: res.user }));
  }

  async function resendVerification() {
    await feathers.service("account").create({ action: "resendVerification" });
  }

  async function forgotPassword(email: string) {
    await feathers.service("account").create({ action: "forgotPassword", email: email.trim() }, { noAuthCheck: true } as any);
  }

  async function resetPassword(email: string, code: string, password: string) {
    await feathers.service("account").create({ action: "resetPassword", email: email.trim(), code: code.replace(/\s+/g, ""), password }, { noAuthCheck: true } as any);
    await login({ email, password });
  }

  async function changePassword(currentPassword: string, password: string) {
    const res = await feathers.service("account").create({ action: "changePassword", currentPassword, password });
    // Other sessions end; switch this one to the fresh token the server issued.
    if (res?.accessToken) await authentication({ strategy: "jwt", accessToken: res.accessToken });
  }

  async function deleteAccount() {
    const id = stateRef.current.user?._id;
    if (!id) return;
    await feathers.service("users").remove(id);
    authPromise.current = null;
    authenticated.current = false;
    try {
      await feathers.service("authentication").remove(null);
    } catch {}
    endSession(false);
    await forgetGuestChoice();
    await localDelete();
  }

  return (
    <AuthStore.Provider
      value={{
        user: state.user,
        ready,
        guestChosen,
        continueAsGuest,
        updateUser,
        login,
        logout,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthStore.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthStore);
  if (!auth) throw Error("useAuth() must be inside the AuthProvider.");
  return auth;
}
