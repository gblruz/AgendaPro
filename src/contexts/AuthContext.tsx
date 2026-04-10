/**
 * @module AuthContext
 * @description Contexto global de autenticação do AgendaPro.
 *
 * ## Responsabilidades
 * - Manter o estado do usuário logado em memória (React state).
 * - Persistir/restaurar sessão via localStorage (token + user).
 * - Expor ações de login, registro, logout e atualização de perfil.
 *
 * ## Fluxo de boot
 * 1. Ao montar, verifica se há token em localStorage.
 * 2. Se sim, hidrata o state com o user salvo e valida via `authAPI.me()`.
 * 3. Se a validação falhar, realiza logout automático.
 * 4. `isLoading` permanece `true` durante esse processo para bloquear
 *    renderizações prematuras de rotas protegidas.
 *
 * ## Uso
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI, type User } from '@/services/api';
import { STORAGE_KEYS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface AuthContextType {
  /** Usuário autenticado, ou `null` se não houver sessão */
  user: User | null;
  /** Atalho derivado: `true` quando `user !== null` */
  isAuthenticated: boolean;
  /** `true` enquanto a sessão está sendo restaurada no boot */
  isLoading: boolean;
  /** Autentica com email/senha e persiste a sessão */
  login: (email: string, password: string) => Promise<void>;
  /** Registra novo usuário e inicia sessão automaticamente */
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  /** Encerra a sessão e limpa o localStorage */
  logout: () => void;
  /** Atualiza os dados do usuário em memória e no localStorage */
  updateUser: (user: User) => void;
}

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Provedor de autenticação — deve envolver toda a árvore de componentes
 * que necessitam de acesso ao usuário autenticado.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão existente ao montar a aplicação
  useEffect(() => {
    restoreSession();
  }, []);

  /**
   * Tenta restaurar a sessão do usuário a partir dos dados salvos no
   * localStorage. Valida com a API e faz logout em caso de token inválido.
   */
  async function restoreSession(): Promise<void> {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (!token || !savedUser) {
      setIsLoading(false);
      return;
    }

    // Hidrata imediatamente para evitar flash de tela de carregamento
    setUser(JSON.parse(savedUser));

    try {
      const response = await authAPI.me();
      setUser(response.data.user);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
    } catch {
      // Token inválido ou expirado — encerra a sessão
      logout();
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Autentica o usuário e persiste o token de sessão.
   * @throws {Error} Mensagem de erro legível para exibir no formulário
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data;
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      setUser(user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      throw new Error(message);
    }
  };

  /**
   * Registra um novo usuário e inicia a sessão automaticamente.
   * @throws {Error} Mensagem de erro legível para exibir no formulário
   */
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<void> => {
    try {
      const response = await authAPI.register(data);
      const { user, token } = response.data as { user: User; token: string };
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      setUser(user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      throw new Error(message);
    }
  };

  /** Remove todos os dados de sessão e zera o state do usuário. */
  const logout = (): void => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  };

  /** Atualiza o usuário em memória e no localStorage sem fazer nova requisição. */
  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook consumidor
// ---------------------------------------------------------------------------

/**
 * Hook para consumir o contexto de autenticação.
 * Lança erro se usado fora de um `AuthProvider`.
 *
 * @returns {AuthContextType} Estado e ações de autenticação
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
