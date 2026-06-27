import { useState } from "react";
import { Star, ShieldAlert, ShoppingCart, Plus, ChevronRight } from "lucide-react";

export default function ShowcaseScreen() {
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("Principais Vendedores");

  const [starred, setStarred] = useState<Record<number, boolean>>({});

  const toggleStar = (id: number) => {
    setStarred((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-[5px] p-[5px] pb-10 w-full animate-fade-in">
      {/* Profile Header Box */}
      <section className="p-2 md:p-5 flex flex-col gap-2 md:gap-3 bg-transparent text-white w-full">
        <div className="flex items-start justify-between gap-[5px]">
          <div className="relative">
            <div className="w-20 h-20 md:w-32 md:h-32 overflow-hidden rounded-full">
              <img
                alt="Seller Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD4ODfJcMkKcH9PjpkgsTiL-MuqTPOXdYI420BLiBLzymP1QsT1fDkhlKhN-fuFN1wyokBQB5TbLPSfCYXKrEJfQyyTSAvgHlYBM3SWU_6j27PR2ioKHKbTlst7VNqEt0Kgxh-nU9i2QoBQ93aSMkkAR0Z_e1DZkfAG4qVl_QojiqvUh5iufr41MT6SRiv1asyIkAjTcBvqm3ZQ1IzYOLXYsNSq_jrJg5pXmw4bu-KsA7S-jgvDoDwoXR9T7O0pA1P4SrHICBINeg"
              />
            </div>
            {/* Verified icon indicator */}
            <div className="absolute -bottom-1 -right-1 bg-white p-[3px] md:p-1 rounded-full">
              <span className="text-[10px] md:text-[13px] text-black font-bold">✓</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-1 pl-3">
            <button
              onClick={() => setFollowing(!following)}
              className="font-hanken text-[12px] md:text-[14px] font-extrabold px-4 py-2 md:px-6 md:py-3 uppercase tracking-widest active:scale-95 transition-all bg-white text-black hover:bg-neutral-200 shadow"
            >
              {following ? "Seguindo" : "Seguir"}
            </button>

            {/* Rank / Trust badges */}
            <div className="flex gap-[4px] mt-1">
              <div className="px-2 py-0.5 text-center bg-transparent">
                <p className="text-[9px] md:text-[11px] font-hanken text-white opacity-80 font-extrabold uppercase">
                  Rank
                </p>
                <p className="text-[12px] md:text-[16px] font-chivo font-black text-white">
                  #12
                </p>
              </div>
              <div className="px-2 py-0.5 text-center bg-transparent">
                <p className="text-[9px] md:text-[11px] font-hanken text-white opacity-80 font-extrabold uppercase">
                  Confiança
                </p>
                <p className="text-[12px] md:text-[16px] font-chivo font-black text-white">
                  99%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col leading-tight mt-1 md:mt-3">
          <h1 className="font-chivo text-[20px] md:text-[34px] font-black text-white tracking-tighter uppercase leading-tight">
            Marcus V. Bolada
          </h1>
          <p className="font-hanken text-[13px] md:text-[16px] text-white opacity-90 leading-snug md:leading-relaxed">
            Especialista Em Ativos De Alta Performance Premium. Focado Em Execução Rápida
            E Negociação De Volatilidade Líder De Mercado. Baseado Em Zurique.
          </p>
        </div>

        {/* Triple Stat Row */}
        <div className="grid grid-cols-3 gap-[3px] pt-2 md:pt-4">
          <div className="bg-zinc-950/40 p-2 text-center rounded-[6px]">
            <span className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 font-extrabold uppercase block mb-0.5">
              Vendas
            </span>
            <span className="font-chivo text-[16px] md:text-[24px] font-extrabold text-white block leading-none">
              1.2K
            </span>
          </div>
          <div className="bg-zinc-950/40 p-2 text-center rounded-[6px]">
            <span className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 font-extrabold uppercase block mb-0.5">
              Seguidores
            </span>
            <span className="font-chivo text-[16px] md:text-[24px] font-extrabold text-white block leading-none">
              8.4K
            </span>
          </div>
          <div className="bg-zinc-950/40 p-2 text-center rounded-[6px]">
            <span className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 font-extrabold uppercase block mb-0.5">
              Volume
            </span>
            <span className="font-chivo text-[16px] md:text-[24px] font-extrabold text-white block leading-none">
              $4.2M
            </span>
          </div>
        </div>
      </section>

      {/* Filter Horizontal Tabs */}
      <div className="flex gap-[5px] overflow-x-auto pb-1 no-scrollbar md:py-3 w-full">
        {["Principais Vendedores", "Recentes", "Leilões", "Coleções"].map((tab) => (
          <span
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`cursor-pointer px-4 py-2 md:px-6 md:py-3 font-chivo text-[16px] md:text-[18px] font-extrabold rounded-[10px] whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-white text-black"
                : "bg-zinc-800 text-neutral-300 hover:text-white"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Bento Showcase Grid - reorganizes beautifully to 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[5px] w-full">
        {/* Featured Onyx Deal */}
        <div className="col-span-2 md:col-span-4 relative overflow-hidden group bg-transparent">
          <div className="aspect-video relative overflow-hidden rounded-[8px]">
            <img
              alt="Onyx watch"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYvwOwWZfb8nTlmdHBtoKp3jRICv-ISuM6QIAHQ1apMcvqljaYMHRfLQ_fx0tX7iMRFqF63SpZkyEltk0ygkRQAbCKynAhVqpozjnai76cdem6E4nmpTV4MCi0kyWw4_7Xc0K3jecoOIouztGiglCX5wL-VyH4FOt67Xb1WMKQDiLZu1d_pBOrRfA5pMMbIwJq4PAJl-6c4VgA-3coHmBYWdbucrUR7D60Lj10Ir7fQvdve3b6znXrDBIQsl-fvi9cY_AFZI1Z2J0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-85"></div>
            <div className="absolute bottom-2 left-2 p-1 md:p-3 w-[90%]">
              <span className="bg-white text-black px-2 py-0.5 font-chivo text-[9px] md:text-[11px] font-black uppercase tracking-wider rounded-[1px]">
                Destaque
              </span>
              <div className="flex justify-between items-end mt-1 md:mt-3">
                <h3 className="font-chivo text-[14px] md:text-[22px] font-black text-white leading-none">
                  Protocolo Onyx V2
                </h3>
                <span className="font-chivo text-[16px] md:text-[26px] font-extrabold text-white leading-none">
                  $12,400
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cobalt Core */}
        <div className="flex flex-col bg-transparent p-1 md:p-2.5">
          <div className="aspect-square bg-transparent overflow-hidden rounded-[6px]">
            <img
              className="w-full h-full object-cover transition-all duration-350 group-hover:scale-105 hover:scale-[1.03]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgQQ-42D1NHnBMKTP3ky6ViuAJjpVgTQ26WwPQJSccLvxAvjk8SoetCoPkryzwSDk4NlbwBHPzQ5JghyqiT7H7ku_MYIrsLm8UnDh6mwV3OSR7n78BEBSJO--4Lvl-uGQN0w6W1ddV7b7fjgmjnLR4arJ6VEHzhRbzfNjbP8IJ0W0XyTP8Qgqeq6rBOMOEak93rLfRdRmH-KqVBdcAZ9ebsdeoogzBK20H6LDHTKNruMK-CVpkxAOK_kjJdAhRa8FkruOANPTTDJQ"
              alt="Hardware"
            />
          </div>
          <div className="p-1 flex flex-col gap-[2px]">
            <div className="flex justify-between items-center mt-1">
              <span className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 font-extrabold uppercase">
                Hardware
              </span>
              <button onClick={() => toggleStar(1)}>
                <Star
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                    starred[1] ? "fill-current text-white" : "text-white opacity-50"
                  }`}
                />
              </button>
            </div>
            <span className="font-chivo text-[11px] md:text-[14px] font-bold text-white truncate">
              Módulo De Núcleo De Cobalto
            </span>
            <span className="font-chivo text-[14px] md:text-[18px] text-white font-extrabold">$2,850</span>
          </div>
        </div>

        {/* Neural Link Array */}
        <div className="flex flex-col bg-transparent p-1 md:p-2.5">
          <div className="aspect-square bg-transparent overflow-hidden rounded-[6px]">
            <img
              className="w-full h-full object-cover transition-all duration-350 hover:scale-[1.03]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDESQgGjDuBD-zBG4gP9flZTggCqL3lrs0MCYvqpBZO8aao0AHbzpxuxR72bLAUZn1wSt_Ki0pKnezhwRyxdtQd9m9nuVGSSdbUyt7A2W9Z9QKwY-K6sUSlDC104DT0csvn54tDXJd63yiBQxfiVN5fngyo-BfD1weU5G6fQTkaAe_TicaOjF9GWiH7AlknSVLny6C78hBnuOEyLrDm8F6HEsUEJLVPXjpAeERNflx2mbgvdw38dkJupsGDzcYsOR_VqyU3V9nodxQ"
              alt="System"
            />
          </div>
          <div className="p-1 flex flex-col gap-[2px]">
            <div className="flex justify-between items-center mt-1">
              <span className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 font-extrabold uppercase">
                Sistemas
              </span>
              <button onClick={() => toggleStar(2)}>
                <Star
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                    starred[2] ? "fill-current text-white" : "text-white opacity-50"
                  }`}
                />
              </button>
            </div>
            <span className="font-chivo text-[11px] md:text-[14px] font-bold text-white truncate">
              Matriz De Link Neural
            </span>
            <span className="font-chivo text-[14px] md:text-[18px] text-white font-extrabold">$8,100</span>
          </div>
        </div>

        {/* Global Relay Node */}
        <div className="flex flex-col bg-transparent p-1 md:p-2.5">
          <div className="aspect-square bg-transparent overflow-hidden rounded-[6px]">
            <img
              className="w-full h-full object-cover transition-all duration-350 hover:scale-[1.03]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8rByL5PQZzWKs8EVcXxHcTNCY5RXkKOSdD9IQ4Uspr6Pnjoacaew7Vyx47Kf8g5aEvD2w31a6LCxS-WKNfao3fsVnTIMVyhZO-d3BZ0sPqCPytY1U-OkO76AI3ExNpRwwanj0j1eR6Ydd46jqRLC62qX55Po3BuWkOcDdTIUh4GNCqrCbFlejJQe37Gzhi7ceKU2u5od3gj1zbeNFhbscUIsffcJzXxRso4JJHpTQffZg3WmcFYX16Pw3d7poFyxXEzo2Cb1wdlM"
              alt="Network"
            />
          </div>
          <div className="p-1 flex flex-col gap-[2px]">
            <div className="flex justify-between items-center mt-1">
              <span className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 font-extrabold uppercase">
                Redes
              </span>
              <button onClick={() => toggleStar(3)}>
                <Star
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                    starred[3] ? "fill-current text-white" : "text-white opacity-50"
                  }`}
                />
              </button>
            </div>
            <span className="font-chivo text-[11px] md:text-[14px] font-bold text-white truncate">
              Nó De Transmissão Global
            </span>
            <span className="font-chivo text-[14px] md:text-[18px] text-white font-extrabold">$1,420</span>
          </div>
        </div>

        {/* Cryptic Key S6 */}
        <div className="flex flex-col bg-transparent p-1 md:p-2.5">
          <div className="aspect-square bg-transparent overflow-hidden rounded-[6px]">
            <img
              className="w-full h-full object-cover transition-all duration-350 hover:scale-[1.03]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-NnCEGXfACUCfXePom0fe7KcME6PNisMgLMv1SU5L8_mWBeewkeXHBgxaXi_VdS111Qz-fICqBIRsXAvQN3L3SkyBc-Hag4x0TqHurlsrqw7tLcU4HUkzXql5CHEHH4UaysfH3tkI_NhobTknp6dMonrY2M6B2-uz9iSPUSoQyHSIYBqKl8xJr_jMzg_PUIHuSiUryEl4BqmIJah0LIOjrVkg4J83zLmNUwmfhnYe7UgotqJqMyn9T50ysou9h4lkNhzk1QQgUl0"
              alt="Asset"
            />
          </div>
          <div className="p-1 flex flex-col gap-[2px]">
            <div className="flex justify-between items-center mt-1">
              <span className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 font-extrabold uppercase">
                Ativos
              </span>
              <button onClick={() => toggleStar(4)}>
                <Star
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                    starred[4] ? "fill-current text-white" : "text-white opacity-50"
                  }`}
                />
              </button>
            </div>
            <span className="font-chivo text-[11px] md:text-[14px] font-bold text-white truncate">
              Chave Críptica S6
            </span>
            <span className="font-chivo text-[14px] md:text-[18px] text-white font-extrabold">$450</span>
          </div>
        </div>
      </div>

      {/* Recent Activity List Block */}
      <section className="flex flex-col mt-[5px] md:mt-4 bg-transparent w-full">
        <div className="px-2 py-[5px] border-b border-zinc-900 mb-1.5 md:py-3 mb-3">
          <h2 className="font-hanken text-[10px] md:text-[13px] text-white font-extrabold uppercase tracking-widest">
            Atividade Recente
          </h2>
        </div>
        <div className="flex flex-col gap-[1px]">
          <div className="p-[5px] md:p-3.5 flex items-center justify-between hover:bg-white/10 transition-colors rounded-[6px]">
            <div className="flex items-center gap-[5px] md:gap-3">
              <ShoppingCart className="text-white w-4 h-4 md:w-5 md:h-5" />
              <div>
                <p className="font-hanken text-[12px] md:text-[15px] text-white font-bold leading-tight">
                  Vendeu "Estrutura De Vácuo X"
                </p>
                <p className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 leading-none">
                  Há 2 Minutos
                </p>
              </div>
            </div>
            <span className="font-chivo text-[13px] md:text-[17px] font-black text-white">
              +$4,200
            </span>
          </div>

          <div className="p-[5px] md:p-3.5 flex items-center justify-between hover:bg-white/10 transition-colors rounded-[6px]">
            <div className="flex items-center gap-[5px] md:gap-3">
              <Plus className="text-white w-4 h-4 md:w-5 md:h-5 stroke-[3]" />
              <div>
                <p className="font-hanken text-[12px] md:text-[15px] text-white font-bold leading-tight">
                  Listou 3 Novos Ativos
                </p>
                <p className="font-hanken text-[10px] md:text-[12px] text-white opacity-80 leading-none">
                  Há 1 Hora
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white opacity-70" />
          </div>
        </div>
      </section>
    </div>
  );
}
