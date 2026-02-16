import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wifi } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-[#6952E0] p-3 rounded-xl mb-2">
            <Wifi className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">ASK Timer</h1>
          <p className="text-slate-400">Restricted Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#6952E0] hover:bg-[#5b45c9] font-bold" disabled={loading}>
            {loading ? "Verifying..." : "Enter System"}
          </Button>
        </form>
      </div>
    </div>
  );
}