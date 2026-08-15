import { Navigate, Route, Routes } from "react-router-dom";
import AuthGuard from "@/components/custom/AuthGuard";
import ProfilePage from "@/pages/profile";

function App() {
  return (
    <Routes>
      <Route
        path="/profile"
        element={
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/profile" replace />} />
    </Routes>
  );
}

export default App;
