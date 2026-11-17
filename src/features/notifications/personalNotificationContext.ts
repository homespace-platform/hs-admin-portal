import { createContext, useContext } from "react";
export interface PersonalNotificationState {
  owner: string | null;
  count: number | null;
  version: number;
  error: boolean;
  refresh: () => void;
}
export const PersonalNotificationContext = createContext<PersonalNotificationState>({ owner: null, count: null, version: 0, error: false, refresh() {} });
export const usePersonalNotifications = () => useContext(PersonalNotificationContext);
