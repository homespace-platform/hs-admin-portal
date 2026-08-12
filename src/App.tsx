import { Route, Routes } from "react-router-dom";
import AuthGuard from "@/components/custom/AuthGuard";
import HomePage from "@/pages/home";

function App() {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <AuthGuard>
            <HomePage />
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default App;
