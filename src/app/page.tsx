"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../utils/supabase/client";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) router.push("/dashboard");
    };
    checkUser();
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) alert(error.message);
    else alert("Check your email for the login link!");
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-zinc-200 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="mb-10 text-center">
          <h1 className="text-6xl font-bold tracking-tighter mb-2 text-white flex items-center justify-center gap-3">
            Umbra <span className="text-neon text-4xl">.</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Turn handwriting into knowledge.
          </p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-zinc-800 ring-1 ring-white/5">
          <div className="mb-6">
            <label className="text-xs font-bold text-neon uppercase tracking-widest mb-2 block">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full bg-zinc-950 border border-zinc-800 text-white p-4 rounded-xl focus:ring-2 focus:ring-neon/50 focus:border-neon focus:outline-none transition-all placeholder:text-zinc-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-neon text-black hover:bg-yellow-400 p-4 rounded-xl flex items-center justify-center gap-2 font-bold tracking-wide transition-all active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LogIn size={20} />
            )}
            Sign In
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-2 text-zinc-500 text-sm">
          <Sparkles size={16} className="text-neon" />
          <span>Powered by Gemini</span>
        </div>
      </div>
    </div>
  );
}
