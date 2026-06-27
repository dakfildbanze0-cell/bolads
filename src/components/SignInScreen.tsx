import { useState, FormEvent } from "react";
import { Mail, Key, Shield, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function SignInScreen({
  onLoginSuccess,
  onGoToSignUp,
  onGoToRecovery,
  onOpenPolicies,
}: {
  onLoginSuccess: () => void;
  onGoToSignUp: () => void;
  onGoToRecovery: () => void;
  onOpenPolicies?: (type: "terms" | "privacy") => void;
}) {
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const handleGoogleSignIn = async () => {
    if (logging) return;
    setLogging(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      console.error("Erro Completo Do Supabase (Google Login):", e);
      setError(e.message || "Erro ao autenticar com o Google.");
    } finally {
      setLogging(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (logging) return;
    
    setLogging(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: key
      });
      if (error) throw error;
      onLoginSuccess();
    } catch (e: any) {
      console.error("Erro completo do Supabase (Login):", e);
      if (e.message === "Failed to fetch" || e.message?.includes("fetch")) {
        setError("Erro de conexão com o servidor. Se estiver usando Adblocker ou vpn, tente desativá-los ou abra o app em uma nova aba.");
      } else {
        setError(e.message || "Credenciais inválidas. Verifique seu email e senha.");
      }
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-[8px] animate-fade-in bg-zinc-900 gap-[8px]">
      <header className="w-full max-w-[360px] md:max-w-[480px] mb-2 flex flex-col items-center text-center leading-tight text-white gap-[8px]">
        {/* Official Splash-matching Logo */}
        <div className="flex flex-col items-center justify-center">
          {!logoError ? (
            <img
              src="/dak.png"
              alt="Dak Logo"
              className="w-[120px] h-[120px] object-contain select-none mb-1"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-[120px] h-[120px] mb-1 rounded-[24px] bg-white text-black flex items-center justify-center font-chivo text-[28px] font-black tracking-tighter shadow-xl">
              Dak
            </div>
          )}
        </div>
        <h1 className="font-chivo text-[32px] md:text-[48px] font-black text-white tracking-tighter leading-none">
          Boladas
        </h1>
        <p className="font-hanken text-[11px] md:text-[14px] font-extrabold text-white opacity-80 tracking-widest mt-0.5">
          Cockpit de desempenho de vendas
        </p>
      </header>

      {/* Main signin canvas - No borders, no background */}
      <main className="w-full max-w-[360px] md:max-w-[480px] flex flex-col gap-[8px]">
        {/* Description panel */}
        <section className="p-2 flex flex-col gap-[4px] bg-transparent text-white">
          <h2 className="font-chivo text-[17px] md:text-[24px] font-extrabold text-white leading-tight">
            Entrar
          </h2>
          <p className="font-hanken text-[12px] md:text-[15px] text-white opacity-90 leading-relaxed">
            Faça login com suas credenciais seguras para sincronizar sua carteira.
          </p>
        </section>

        {/* Input Form card */}
        <form
          onSubmit={handleSubmit}
          className="p-2 flex flex-col gap-[8px] bg-transparent text-white"
        >
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-500 font-hanken text-[11px] uppercase tracking-tight text-center">
              {error}
            </div>
          )}

          {/* Email Address */}
          <div className="flex flex-col gap-[4px]">
            <label className="font-hanken text-[11px] md:text-[13px] font-extrabold text-white opacity-80 ml-1">
              Endereço de email
            </label>
            <div className="relative flex items-center bg-transparent h-11 md:h-14 px-2 border-b border-zinc-700 focus-within:border-white transition-all pb-1">
              <Mail className="text-white w-5 h-5 mr-3 shrink-0" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="desenvolvedor@boladas.com"
                className="bg-transparent border-none text-[16px] md:text-[18px] w-full focus:outline-none focus:ring-0 text-white placeholder:text-white/40 font-medium"
                type="email"
                required
              />
            </div>
          </div>

          {/* Security Key */}
          <div className="flex flex-col gap-[4px]">
            <label className="font-hanken text-[11px] md:text-[13px] font-extrabold text-white opacity-80 ml-1">
              Chave de segurança
            </label>
            <div className="relative flex items-center bg-transparent h-11 md:h-14 px-2 border-b border-zinc-700 focus-within:border-white transition-all pb-1">
              <Key className="text-white w-5 h-5 mr-3 shrink-0" />
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="••••••••••••"
                className="bg-transparent border-none text-[16px] md:text-[18px] w-full focus:outline-none focus:ring-0 text-white placeholder:text-white/40 font-medium"
                type="password"
                required
              />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            className="w-full bg-white hover:bg-neutral-200 text-black transition-all active:scale-[0.98] h-11 md:h-14 flex items-center justify-center gap-[8px] font-hanken text-[14px] md:text-[16px] font-extrabold rounded-[8px] border-none cursor-pointer"
          >
            <span>{logging ? "Autenticando..." : "Entrar"}</span>
            <ArrowRight className="w-5 h-5 text-black stroke-[3]" />
          </button>

          {/* Google Sign-in restore */}
          <div className="flex items-center gap-[8px] my-1">
            <div className="h-[1px] bg-zinc-800 flex-1"></div>
            <span className="font-hanken text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold select-none">Ou</span>
            <div className="h-[1px] bg-zinc-800 flex-1"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-zinc-800 hover:bg-zinc-750 text-white transition-all active:scale-[0.98] h-11 md:h-14 flex items-center justify-center gap-[8px] font-hanken text-[14px] md:text-[16px] font-extrabold rounded-[8px] border border-zinc-700 cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Entrar com o Google</span>
          </button>

          {/* Help access recover linkages */}
          <div className="flex items-center justify-between mt-2 px-1 gap-[8px]">
            <span
              onClick={onGoToRecovery}
              className="font-hanken text-[11px] md:text-[13px] font-bold text-white opacity-80 hover:opacity-100 cursor-pointer tracking-tight"
            >
              Esqueceu a senha?
            </span>
            <span
              onClick={onGoToSignUp}
              className="font-hanken text-[11px] md:text-[13px] font-black text-white hover:underline cursor-pointer tracking-tight"
            >
              Cadastre-se para acesso
            </span>
          </div>

          <div className="mt-3 text-center">
            <span className="font-hanken text-[11px] md:text-[12px] text-zinc-400">
              Ao continuar, você concorda com os{" "}
              <button
                type="button"
                onClick={() => onOpenPolicies?.("terms")}
                className="bg-transparent border-none text-white underline cursor-pointer p-0 font-bold"
              >
                Termos
              </button>{" "}
              e a{" "}
              <button
                type="button"
                onClick={() => onOpenPolicies?.("privacy")}
                className="bg-transparent border-none text-white underline cursor-pointer p-0 font-bold"
              >
                Privacidade
              </button>
            </span>
          </div>
        </form>

        {/* Secured Dekrypt Frame */}
        <div className="p-2 flex flex-col gap-[4px] bg-transparent text-white">
          <div className="flex items-center gap-[4px] leading-none opacity-40">
            <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            <span className="font-hanken text-[9px] md:text-[11px] font-extrabold tracking-widest">
              Estrutura de descriptografia protegida
            </span>
          </div>
          <div className="grid grid-cols-4 gap-[2px] mt-1 h-3 opacity-30">
            <div className="bg-white rounded-[1px] h-full"></div>
            <div className="bg-white rounded-[1px] h-full"></div>
            <div className="bg-white rounded-[1px] h-full"></div>
            <div className="bg-white rounded-[1px] h-full"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
