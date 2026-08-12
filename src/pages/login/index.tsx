import { LogIn, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import keycloak from "@/lib/keycloak";

export default function LoginPage() {
  const handleLogin = () => keycloak.login();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-teal-50/40 to-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 mb-5">
          <Shield className="h-7 w-7 text-teal-700" />
        </div>

        <h1 className="text-xl font-bold text-slate-800">HomeSpace Admin</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Đăng nhập qua Keycloak SSO
        </p>

        <Button
          onClick={handleLogin}
          size="lg"
          className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl"
        >
          <LogIn className="h-4 w-4" data-icon="inline-start" />
          Đăng nhập
        </Button>

        <p className="text-xs text-slate-400 mt-5">
          Realm: homespace-platform · Client: homespace-id
        </p>
      </div>
    </div>
  );
}
