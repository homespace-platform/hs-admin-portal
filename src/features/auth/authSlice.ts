import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  initialized: boolean;
  authenticated: boolean;
  userId: string | null;
  username: string | null;
  email: string | null;
  roles: string[];
}

type AuthSession = Omit<AuthState, "initialized">;

const initialState: AuthState = {
  initialized: false,
  authenticated: false,
  userId: null,
  username: null,
  email: null,
  roles: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionInitialized(state, action: PayloadAction<AuthSession>) {
      Object.assign(state, action.payload, { initialized: true });
    },
    sessionCleared(state) {
      Object.assign(state, initialState, { initialized: true });
    },
  },
});

export const { sessionInitialized, sessionCleared } = authSlice.actions;
export default authSlice.reducer;
