export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  access_token: string;
  expires_at: number;
  user: User;
}

interface AuthState {
  user: User | null;
  session: Session | null;
}

// Simple in-memory user store
const users = new Map<string, { email: string; password: string }>();

// List of auth state change listeners
type AuthStateChangeCallback = (event: string, session: Session | null) => void;
const listeners: AuthStateChangeCallback[] = [];

// Default mock state
let authState: AuthState = {
  user: null,
  session: null,
};

// Helper to notify listeners
const notifyListeners = (event: string, session: Session | null) => {
  listeners.forEach(callback => callback(event, session));
};

// Mock authentication service
export const mockAuth = {
  async getSession() {
    return { data: { session: authState.session } };
  },
  
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const userCreds = Array.from(users.entries()).find(([_, creds]) => creds.email === email);
    
    if (!userCreds || userCreds[1].password !== password) {
      return { error: { message: 'Invalid login credentials' } };
    }
    
    const userId = userCreds[0];
    const user: User = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
    };
    
    const session: Session = {
      access_token: `mock-token-${userId}`,
      expires_at: Date.now() + 3600 * 1000, // 1 hour from now
      user,
    };
    
    authState = { user, session };
    notifyListeners('SIGNED_IN', session);
    
    return { data: { user, session }, error: null };
  },
  
  async signUp({ email, password }: { email: string; password: string }) {
    // Check if user already exists
    const exists = Array.from(users.values()).some(creds => creds.email === email);
    
    if (exists) {
      return { error: { message: 'User already exists' } };
    }
    
    const userId = `user_${Date.now()}`;
    users.set(userId, { email, password });
    
    const user: User = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
    };
    
    const session: Session = {
      access_token: `mock-token-${userId}`,
      expires_at: Date.now() + 3600 * 1000, // 1 hour from now
      user,
    };
    
    authState = { user, session };
    notifyListeners('SIGNED_IN', session);
    
    return { data: { user, session }, error: null };
  },
  
  async signOut() {
    authState = { user: null, session: null };
    notifyListeners('SIGNED_OUT', null);
    
    return { error: null };
  },
  
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    listeners.push(callback);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
              listeners.splice(index, 1);
            }
          },
        },
      },
    };
  }
};