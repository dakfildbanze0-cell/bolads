import { useState, FormEvent } from "react";
import { Mail, ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react";

export default function RecoveryScreen({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onBackToLogin();
    }, 1500);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-2 md:p-6 animate-fade-in">
      <header className="w-full max-w-[360px] md:max-w-[480px] mb-3 md:mb-5 flex flex-col items-start leading-tight text-white">
        <h1 className="font-chivo text-[28px] md:text-[44px] font-black text-white tracking-tighter uppercase leading-none">
          Boladas
        </h1>
        <p className="font-hanken text-[11px] md:text-[14px] font-extrabold text-white opacity-80 uppercase tracking-widest mt-0.5 md:mt-1">
          Cockpit De Desempenho De Vendas
        </p>
      </header>

      {/* Main recovery canvas - No borders, no backgrounds */}
      <main className="w-full max-w-[360px] md:max-w-[480px] flex flex-col gap-[5px]">
        {/* Info panel */}
        <section className="p-3 md:p-5 flex flex-col gap-1 bg-transparent text-white">
          <h2 className="font-chivo text-[17px] md:text-[24px] font-extrabold text-white leading-tight uppercase">
            Recuperar Acesso
          </h2>
          <p className="font-hanken text-[12px] md:text-[15px] text-white opacity-90 leading-relaxed">
            Insira O E-mail Cadastrado Abaixo Para Receber Um Link Seguro De Redefinição De Chave.
          </p>
        </section>

        {/* Input Form card */}
        <form
          onSubmit={handleSubmit}
          className="p-3 md:p-5 flex flex-col gap-[5px] md:gap-3 bg-transparent text-white"
        >
          {/* Corporate Email */}
          <div className="flex flex-col gap-1">
            <label className="font-hanken text-[10px] md:text-[12px] font-extrabold text-white opacity-80 uppercase ml-1">
              E-mail Corporativo
            </label>
            <div className="relative flex items-center bg-transparent h-10 md:h-14 px-2 md:px-3 transition-colors">
              <Mail className="text-white w-4 h-4 md:w-5 md:h-5 mr-2" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendas@boladas.com"
                className="bg-transparent border-none text-sm md:text-base w-full focus:outline-none focus:ring-0 text-white placeholder:text-white/40 font-medium"
                type="email"
                required
              />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            className="w-full bg-white hover:bg-neutral-200 text-black transition-all active:scale-[0.98] h-10 md:h-14 mt-1 flex items-center justify-center gap-1 font-hanken text-[14px] md:text-[16px] font-extrabold uppercase tracking-tight"
          >
            <span>{sent ? "Processando..." : "Recuperar"}</span>
            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-black ${sent ? "animate-spin" : "stroke-[3]"}`} />
          </button>

          {/* Return link */}
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full mt-1 md:mt-2 py-2 md:py-3 flex items-center justify-center gap-2 hover:opacity-85 transition-opacity font-hanken text-[10px] md:text-[12px] font-extrabold text-white uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            <span>Voltar Para Login</span>
          </button>
        </form>

        {/* AES Indicator */}
        <div className="p-2 md:p-4 flex items-center justify-between bg-transparent opacity-50 text-white">
          <div className="flex items-center gap-[4px] leading-none">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
            <span className="font-hanken text-[10px] md:text-[12px] font-bold text-white uppercase tracking-wider">
              Ambiente Protegido AES-256
            </span>
          </div>
          <span className="font-hanken text-[9px] md:text-[11px] text-white font-bold uppercase tracking-widest">
            Online
          </span>
        </div>
      </main>
    </div>
  );
}
