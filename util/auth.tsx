import { User } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabase-client";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getInitialUser();
  }, []);

  const getInitialUser = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<string | null> => {
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      return signUpError.message;
    }
    setUser(user);
    return null;
  };

  const login = async (
    email: string,
    password: string
  ): Promise<string | null> => {
    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) {
      return loginError.message;
    }
    setUser(user);
    return null;
  };

  const signOut = async (): Promise<string | null> => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      return signOutError.message;
    }
    setUser(null);
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
