


export interface User {
    id: number;
    email: string;
    role: 'ADMIN' | 'USER' | string;
    nombre?: string;
    apellido?: string;
}


export interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
}


export interface LoginResponse {
    success: boolean;
    token: string;
    user: User;
}
