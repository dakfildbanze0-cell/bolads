import React from "react";
import { Search, MessageSquare, Handshake, ArrowRight } from "lucide-react";

interface LandingScreenProps {
  onNavigate: (screen: string) => void;
  onOpenPolicies?: (type: "terms" | "privacy") => void;
}

export default function LandingScreen({ onNavigate, onOpenPolicies }: LandingScreenProps) {
  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto overflow-x-hidden font-hanken">
      {/* Navbar with maximum 8px gaps and custom design */}
      <nav className="fixed top-0 left-0 w-full h-[60px] bg-black/95 backdrop-blur-md z-50 border-b border-zinc-900 flex items-center justify-between px-4">
        <div className="flex items-center gap-[8px] select-none cursor-pointer" onClick={() => onNavigate("feed")}>
          <img src="/logo-top.pnp.png" alt="Boladas" className="h-[24px] object-contain" />
        </div>
        <div className="flex items-center gap-[8px]">
          <button 
            onClick={() => onNavigate("signin")}
            className="text-[14px] font-black text-zinc-300 hover:text-white transition-colors cursor-pointer px-[8px]"
          >
            Entrar
          </button>
          <button 
            onClick={() => onNavigate("signup")}
            className="text-[14px] font-black bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-full transition-all cursor-pointer shadow-lg shadow-white/5"
          >
            Começar agora
          </button>
        </div>
      </nav>

      {/* Hero Section styled exactly like the screenshot with monochrome highlights */}
      <section className="relative pt-[110px] pb-[8px] px-4 flex flex-col items-center justify-center min-h-[85vh] text-center gap-[8px]">
        {/* Subtle white ambient glow as the highlight (pure monochrome) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-white/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10 max-w-3xl flex flex-col items-center gap-[8px]">
          {/* Badge styled like screenshot but with monochrome style and sentence-case */}
          <div className="bg-zinc-900 border border-zinc-800 text-white text-[11px] font-bold tracking-widest px-4 py-1.5 rounded-full mb-[8px]">
            A maior rede de serviços de moçambique
          </div>
          
          {/* Massive high-impact typography identical to screenshot layout but sentence-case, long and elegant */}
          <h1 className="font-chivo text-[36px] sm:text-[54px] md:text-[68px] lg:text-[76px] font-black leading-[0.98] tracking-tighter mb-[8px] text-white flex flex-col items-center max-w-4xl">
            <span>O maior marketplace inteligente</span>
            <span>de Moçambique.</span>
          </h1>
          
          <p className="text-zinc-400 text-[15px] sm:text-[17px] md:text-[19px] max-w-2xl font-medium leading-relaxed mb-[8px]">
            Explore anúncios verificados com total transparência, conecte-se com compradores reais e feche negócios extraordinários em tempo recorde de maneira simples, moderna e totalmente segura.
          </p>
          
          {/* Single large pill-shaped button as requested */}
          <div className="flex items-center justify-center w-full mt-[8px]">
            <button 
              onClick={() => onNavigate("signup")}
              className="w-full sm:w-[260px] bg-white hover:bg-zinc-200 text-black font-black text-[15px] px-10 py-4 rounded-full transition-all cursor-pointer shadow-xl shadow-white/10 flex items-center justify-center gap-[8px]"
            >
              Começar agora
              <ArrowRight className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      </section>

      {/* How it Works Section with max 8px spacing */}
      <section className="py-[16px] px-4 bg-[#050505] border-t border-zinc-900 relative gap-[8px] flex flex-col items-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-[8px]">
          <div className="text-center mb-[8px] mt-[8px] flex flex-col items-center gap-[8px]">
            <h2 className="font-chivo text-[28px] md:text-[36px] font-black tracking-tight text-white mb-[8px]">
              Como funciona
            </h2>
            <p className="text-zinc-400 text-[15px] max-w-lg">
              Três passos simples para fechar um ótimo negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[8px] w-full mt-[8px]">
            {/* Card 1 */}
            <div className="bg-[#0a0a0a] border border-zinc-900 p-8 rounded-[24px] flex flex-col items-center text-center hover:border-zinc-800 transition-colors gap-[8px]">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-[8px] text-black shadow-md shadow-white/5">
                <Search className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-chivo text-[18px] font-black tracking-wide text-white mb-[8px]">
                Pesquise
              </h3>
              <p className="text-zinc-400 text-[13px] leading-relaxed">
                Encontre os melhores produtos por categoria, localização ou preço, utilizando o nosso sistema de buscas otimizado.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#0a0a0a] border border-zinc-900 p-8 rounded-[24px] flex flex-col items-center text-center hover:border-zinc-800 transition-colors gap-[8px]">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-[8px] text-black shadow-md shadow-white/5">
                <MessageSquare className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-chivo text-[18px] font-black tracking-wide text-white mb-[8px]">
                Negocie
              </h3>
              <p className="text-zinc-400 text-[13px] leading-relaxed">
                Converse diretamente com o vendedor através do chat integrado e tire todas as suas dúvidas de forma rápida.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#0a0a0a] border border-zinc-900 p-8 rounded-[24px] flex flex-col items-center text-center hover:border-zinc-800 transition-colors gap-[8px]">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-[8px] text-black shadow-md shadow-white/5">
                <Handshake className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-chivo text-[18px] font-black tracking-wide text-white mb-[8px]">
                Feche negócio
              </h3>
              <p className="text-zinc-400 text-[13px] leading-relaxed">
                Combine a entrega e o pagamento diretamente com o vendedor, de forma segura e flexível.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with max 8px gaps */}
      <footer className="py-[16px] px-4 border-t border-zinc-900 bg-black">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <img src="/logo-top.pnp.png" alt="Boladas" className="h-[20px] object-contain opacity-80" />
          </div>
          
          <div className="flex items-center gap-[8px] text-[12px] font-bold text-zinc-500">
            <button 
              onClick={() => onOpenPolicies ? onOpenPolicies("terms") : onNavigate("policies")} 
              className="hover:text-white transition-colors cursor-pointer px-[4px]"
            >
              Termos
            </button>
            <button 
              onClick={() => onOpenPolicies ? onOpenPolicies("privacy") : onNavigate("policies")} 
              className="hover:text-white transition-colors cursor-pointer px-[4px]"
            >
              Privacidade
            </button>
            <a href="tel:875599207" className="hover:text-white transition-colors cursor-pointer px-[4px]">Contacto (875599207)</a>
          </div>

          <div className="text-zinc-650 text-[12px]">
            &copy; {new Date().getFullYear()} Boladas. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
