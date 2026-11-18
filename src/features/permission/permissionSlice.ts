import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import permissionService from "@/services/permission.service";
import { sessionCleared } from "@/features/auth/authSlice";
import { userCleared } from "@/features/user/userSlice";
import { getApiErrorMessage } from "@/utils/apiError";
import type { RootState } from "@/store";

export interface PermissionState {
  granted: string[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PermissionState = { granted: [], status: "idle", error: null };

export const fetchPermissions = createAsyncThunk<
  string[],
  void,
  { state: RootState; rejectValue: string }
>(
  "permission/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return (await permissionService.getMine()).permissions ?? [];
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Không thể tải quyền hạn"));
    }
  },
  { condition: (_, { getState }) => getState().permission.status !== "loading" },
);

const permissionSlice = createSlice({
  name: "permission",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        if (state.status !== "loading") return; // session cleared while in flight
        state.granted = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        if (action.meta.condition || state.status !== "loading") return;
        state.granted = []; // fail closed
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Không thể tải quyền hạn";
      })
      .addCase(userCleared, () => initialState)
      .addCase(sessionCleared, () => initialState);
  },
});

export default permissionSlice.reducer;
