import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

export function AdminLogin() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/ops/bootstrap", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        localStorage.setItem("adminToken", token);
        navigate("/admin/dashboard");
      } else {
        setError("认证失败");
      }
    } catch {
      setError("连接失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10">
            <Shield className="h-8 w-8 text-brand" />
          </div>
          <h1 className="font-title text-3xl font-bold text-text1">管理后台</h1>
          <p className="mt-2 text-sm text-text3">荆楚歌 #2</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
          <label className="mb-2 block text-sm font-medium text-text2">Admin Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mb-4 w-full rounded-lg border border-strokeSoft bg-surface3 px-4 py-3 text-text1 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            required
          />

          {error && <div className="mb-4 rounded-lg border border-live/20 bg-live/10 px-4 py-3 text-sm text-live">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand px-4 py-3 font-medium text-canvas transition-all hover:bg-brandStrong disabled:opacity-50"
          >
            {loading ? "验证中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
