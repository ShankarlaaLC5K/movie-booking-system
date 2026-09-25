import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getMe,
  loginUser,
  registerUser,
} from "../services/authService";

import type {
  LoginData,
  RegisterData,
  User,
} from "../types/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const restoreUser = async () => {
      const storedToken =
        localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();

        setUser(response.user);
        setToken(storedToken);
      } catch {
        localStorage.removeItem("token");

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, []);

  const login = async (
    data: LoginData
  ): Promise<void> => {
    try {
      setError(null);

      const response = await loginUser(data);

      localStorage.setItem(
        "token",
        response.token
      );

      setToken(response.token);
      setUser(response.user);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Login failed. Please try again.";

      setError(message);

      throw new Error(message);
    }
  };

  const register = async (
    data: RegisterData
  ): Promise<void> => {
    try {
      setError(null);

      const response =
        await registerUser(data);

      localStorage.setItem(
        "token",
        response.token
      );

      setToken(response.token);
      setUser(response.user);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Registration failed. Please try again.";

      setError(message);

      throw new Error(message);
    }
  };

  const logout = (): void => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = (): void => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
