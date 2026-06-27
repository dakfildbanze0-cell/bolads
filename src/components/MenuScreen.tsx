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
      <h3 className="font-chivo text-[18px] font-bold text-white px-[4px] mt-[4px]">
        Menu de opções
      </h3>

      <div className="flex flex-col gap-[8px] w-full">
        {/* Rectangle 1: Definições */}
        <a
          href="#settings"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("settings", null);
          }}
          className="flex flex-row items-center gap-[12px] p-[12px] w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-[8px] transition-all duration-150 cursor-pointer text-left text-white group no-underline"
        >
          <div className="p-[6px] bg-zinc-900 border border-zinc-700 rounded-[8px] group-hover:border-zinc-600 shrink-0">
            <Settings className="w-4 h-4 text-zinc-350 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold tracking-tight text-white leading-tight">
              Definições
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Ajustar as suas preferências de conta
            </span>
          </div>
        </a>

        {/* Rectangle 2: Suporte e ajuda */}
        <a
          href="#settings"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("settings", "help");
          }}
          className="flex flex-row items-center gap-[12px] p-[12px] w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-[8px] transition-all duration-150 cursor-pointer text-left text-white group no-underline"
        >
          <div className="p-[6px] bg-zinc-900 border border-zinc-700 rounded-[8px] group-hover:border-zinc-600 shrink-0">
            <HelpCircle className="w-4 h-4 text-zinc-350 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold tracking-tight text-white leading-tight">
              Suporte e ajuda
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Pedir assistência ou consultar as perguntas frequentes
            </span>
          </div>
        </a>

        {/* Rectangle 3: Informar bug */}
        <a
          href="#bugs"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("bugs");
          }}
          className="flex flex-row items-center gap-[12px] p-[12px] w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-[8px] transition-all duration-150 cursor-pointer text-left text-white group no-underline"
        >
          <div className="p-[6px] bg-zinc-900 border border-zinc-700 rounded-[8px] group-hover:border-zinc-600 shrink-0">
            <Settings className="w-4 h-4 text-zinc-350 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold tracking-tight text-white leading-tight">
              Informar bug
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Reportar falhas técnicas ou erros no aplicativo
            </span>
          </div>
        </a>

        {/* Rectangle 4: Denúncias */}
        <a
          href="#denuncias"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("denuncias");
          }}
          className="flex flex-row items-center gap-[12px] p-[12px] w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-[8px] transition-all duration-150 cursor-pointer text-left text-white group no-underline"
        >
          <div className="p-[6px] bg-zinc-900 border border-zinc-700 rounded-[8px] group-hover:border-zinc-600 shrink-0">
            <ShieldAlert className="w-4 h-4 text-zinc-350 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold tracking-tight text-white leading-tight">
              Painel de denúncias
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Gerenciar ou visualizar denúncias de anúncios
            </span>
          </div>
        </a>
      </div>

      <div className="pt-[16px] text-center mt-auto">
        <p className="font-hanken text-[11px] font-bold tracking-wide text-zinc-600">
          Boladas
        </p>
      </div>
    </div>
  );
}
