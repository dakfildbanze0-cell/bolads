import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) return;
    
    promptInstall.prompt();
    
    promptInstall.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        setSupportsPWA(false); // Hide the prompt once accepted
      } else {
        console.log("User dismissed the install prompt");
      }
    });
  };

  if (!supportsPWA || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-white text-black p-4 rounded-[12px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-zinc-200">
      <div className="flex flex-col gap-1">
        <span className="font-chivo font-black text-[14px] leading-tight">Instale o App</span>
        <span className="font-hanken text-[12px] font-semibold text-zinc-600 leading-tight">Para melhor experiência</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClick}
          className="flex items-center justify-center bg-black text-white hover:bg-zinc-800 transition-colors px-4 py-2 rounded-[8px] font-bold text-[13px] shadow-md active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" strokeWidth={2.5} />
          Baixar
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-black transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
