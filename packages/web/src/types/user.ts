/**
 * Centralized User Types
 */

/**
 * User data
 */
export interface User {
    id: number;
    email: string;
    role: 'ADMIN' | 'USER' | string;
    nombre?: string;
    apellido?: string;
}

/**
 * Auth state for stores
 */
export interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
}

/**
 * Login response from API
 */
export interface LoginResponse {
    success: boolean;
    token: string;
    user: User;
}
