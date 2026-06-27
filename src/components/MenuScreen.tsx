import React from "react";
import { ArrowLeft, Settings, HelpCircle, Bug, ShieldAlert } from "lucide-react";

interface MenuScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, subView?: string | null) => void;
}

export default function MenuScreen({ onBack, onNavigate }: MenuScreenProps) {
  return (
    <div className="w-full max-w-md mx-auto p-[8px] bg-transparent flex flex-col gap-[8px] animate-fade-in font-sans min-h-[calc(100vh-60px)]">
      {/* Header with Back Button */}
      <div className="flex items-center gap-[8px] pb-[8px] bg-transparent">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-[6px] text-white hover:text-neutral-200 text-[15px] bg-transparent border-none cursor-pointer leading-none active:scale-95 transition-all font-normal"
        >
          <ArrowLeft className="w-5 h-5 text-white shrink-0" strokeWidth={4} />
          <span className="text-white select-none leading-none tracking-wide font-bold">Voltar</span>
        </button>
      </div>

      {/* Title */}
      <h3 className="font-chivo text-[18px] font-black text-white px-[4px] mt-[4px]">
        Menu De Opções
      </h3>

      <div className="flex flex-col gap-[8px] w-full">
        {/* Rectangle 1: Definições */}
        <button
          onClick={() => onNavigate("settings", null)}
          className="flex flex-row items-center gap-[12px] p-[12px] w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-[8px] transition-all duration-150 cursor-pointer text-left text-white group"
        >
          <div className="p-[6px] bg-zinc-900 border border-zinc-700 rounded-[8px] group-hover:border-zinc-600 shrink-0">
            <Settings className="w-4 h-4 text-zinc-350 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold tracking-tight text-white leading-tight">
              Definições
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Ajustar As Suas Preferências De Conta
            </span>
          </div>
        </button>

        {/* Rectangle 2: Suporte e ajuda */}
        <button
          onClick={() => onNavigate("settings", "help")}
          className="flex flex-row items-center gap-[12px] p-[12px] w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-[8px] transition-all duration-150 cursor-pointer text-left text-white group"
        >
          <div className="p-[6px] bg-zinc-900 border border-zinc-700 rounded-[8px] group-hover:border-zinc-600 shrink-0">
            <HelpCircle className="w-4 h-4 text-zinc-350 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold tracking-tight text-white leading-tight">
              Suporte E Ajuda
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Pedir Assistência Ou Consultar As Perguntas Frequentes
            </span>
          </div>
        </button>

        {/* Rectangle 3: Informar bug */}
        <button
          onClick={() => onNavigate("bugs")}
          className="flex flex-row items-center gap-[12px] p-[12px] w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-[8px] transition-all duration-150 cursor-pointer text-left text-white group"
        >
          <div className="p-[6px] bg-zinc-900 border border-zinc-700 rounded-[8px] group-hover:border-zinc-600 shrink-0">
            <Bug className="w-4 h-4 text-zinc-350 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold tracking-tight text-white leading-tight">
              Informar Bug
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Reportar Falhas Técnicas Ou Erros No Aplicativo
            </span>
          </div>
        </button>

        {/* Rectangle 4: Denúncias */}
        <button
          onClick={() => onNavigate("denuncias")}
          className="flex flex-row items-center gap-[12px] p-[12px] w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-[8px] transition-all duration-150 cursor-pointer text-left text-white group"
        >
          <div className="p-[6px] bg-zinc-900 border border-zinc-700 rounded-[8px] group-hover:border-zinc-600 shrink-0">
            <ShieldAlert className="w-4 h-4 text-zinc-350 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold tracking-tight text-white leading-tight">
              Painel De Denúncias
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Gerenciar Ou Visualizar Denúncias De Anúncios
            </span>
          </div>
        </button>
      </div>

      <div className="pt-[16px] text-center mt-auto">
        <p className="font-hanken text-[11px] font-bold tracking-wide text-zinc-600">
          Boladas
        </p>
      </div>
    </div>
  );
}
