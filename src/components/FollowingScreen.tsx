import { useState } from "react";
import { Search, Sliders, CheckSquare } from "lucide-react";

interface FollowingScreenProps {
  products?: any[];
  followedSellers?: Record<string, boolean>;
  onToggleFollow?: (sellerName: string) => void;
  onSelectProduct?: (product: any) => void;
}

export default function FollowingScreen({
  products = [],
  followedSellers = {},
  onToggleFollow,
  onSelectProduct,
}: FollowingScreenProps) {
  const [query, setQuery] = useState("");

  // Derive unique sellers from products list
  const derivedSellers = Array.from(new Set(products.map(p => p.sellerName)))
    .map(name => {
      const p = products.find(prod => prod.sellerName === name);
      return {
        id: name,
        name: name,
        img: p?.sellerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
        vol: "Vol: $1.2M",
        rating: "Avaliação: 4.9",
        badge: "Pro",
        indicator: "bg-white",
      };
    });

  const toggleFollow = (name: string) => {
    if (onToggleFollow) {
      onToggleFollow(name);
    }
  };

  const filteredSellers = derivedSellers.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const nonFollowedSellers = filteredSellers.filter(
    (s) => !followedSellers[s.name]
  );

  // Filter posts of sellers that the user currently follows
  const followedPosts = products.filter((p) => {
    // If the seller name is in followedSellers and is true
    return followedSellers[p.sellerName] === true;
  });

  return (
    <div className="flex flex-col gap-[8px] p-[8px] w-full animate-fade-in text-white">
      {/* Header Section - Max 8px spacing */}
      <section className="py-[4px] flex flex-col gap-[4px]">
        <h2 className="font-chivo text-[20px] md:text-[32px] font-extrabold leading-none text-white">
          Seguindo
        </h2>
        <p className="font-hanken text-[11px] md:text-[13px] text-neutral-400 font-extrabold leading-none">
          Postagens e atualizações de quem você segue
        </p>
      </section>

      {/* Search / Filter bar - Max 8px separation, background integration */}
      <div className="flex gap-[8px] mb-[4px] items-center">
        <div className="relative flex-1 bg-transparent">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Search className="w-4 h-4 text-neutral-400" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent pl-9 pr-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none border-none font-hanken"
            placeholder="Filtrar vendedores..."
            type="text"
          />
        </div>
        <button className="bg-transparent px-2 flex items-center justify-center text-white outline-none border-none">
          <Sliders className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Grid of Sellers not followed - Max 8px gap between grid cards */}
      <div className="flex flex-col gap-[4px]">
        <h3 className="font-chivo text-[14px] md:text-[16px] font-black text-neutral-200">
          Vendedores para seguir
        </h3>
      </div>

      {nonFollowedSellers.length === 0 ? (
        <div className="flex items-center justify-center p-[12px] text-center rounded-[8px] border border-zinc-900 border-dashed">
          <p className="font-hanken text-[12px] text-neutral-400">
            Você já segue todos os vendedores disponíveis!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px] w-full">
          {nonFollowedSellers.map((s) => {
            const isFollowing = followedSellers[s.name] === true;

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-[8px] p-[8px] rounded-[8px] transition-all ${
                  !isFollowing ? "opacity-90" : ""
                }`}
              >
                <div className="flex items-center gap-[8px] min-w-0 pr-[4px]">
                  <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden">
                    <img
                      alt={s.name}
                      className="w-full h-full object-cover"
                      src={s.img}
                    />
                    {isFollowing && s.indicator && (
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${s.indicator} rounded-full`}
                      ></div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-[4px] leading-tight">
                      <span className="font-hanken text-[14px] font-bold text-white truncate">
                        {s.name}
                      </span>
                      {s.badge && (
                        <span className="font-chivo text-[8px] text-white font-black bg-white/20 px-1 rounded-[2px]">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-[4px] items-center text-neutral-400 font-hanken text-[10px] leading-none mt-0.5">
                      <span>{s.vol}</span>
                      <span className="w-1 h-1 bg-neutral-600 rounded-full"></span>
                      <span>{s.rating}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleFollow(s.name)}
                  className={`font-hanken text-[11px] font-extrabold px-3 py-1.5 transition-all rounded-[6px] active:scale-95 cursor-pointer hover:opacity-90 leading-none ${
                    isFollowing
                      ? "bg-white text-black font-black"
                      : "bg-transparent text-white border border-zinc-700"
                  }`}
                >
                  {isFollowing ? "Seguindo" : "Seguir"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Publications section divider - Max 8px gap */}
      <div className="flex flex-col gap-[4px] mt-[8px]">
        <h3 className="font-chivo text-[14px] md:text-[16px] font-black text-neutral-200">
          Publicações de quem você segue
        </h3>
      </div>

      {/* Dynamic feed of followed seller posts - Max 8px gap between cards */}
      <div className="flex flex-col gap-[8px] w-full">
        {followedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-[24px] text-center gap-[8px] rounded-[8px]">
            <CheckSquare className="w-8 h-8 text-neutral-600" />
            <p className="font-hanken text-[13px] text-neutral-400 max-w-[280px] mx-auto">
              Nenhuma publicação disponível. Siga vendedores ativos acima para ver os anúncios deles em tempo real!
            </p>
          </div>
        ) : (
          followedPosts.map((p) => (
            <div
              key={p.id}
              className="flex flex-col md:flex-row gap-[8px] p-[8px] rounded-[8px] hover:bg-zinc-900/20 transition-colors"
            >
              {/* Product Post Thumbnail Image */}
              <div className="relative w-full md:w-36 aspect-video md:aspect-square flex-shrink-0 overflow-hidden rounded-[6px] bg-black">
                <img
                  alt={p.name}
                  className="w-full h-full object-cover"
                  src={p.img}
                />
                {p.badge && (
                  <span className="absolute top-[4px] right-[4px] bg-black/80 text-white font-chivo text-[9px] font-bold px-1.5 py-0.5 rounded-[2px]">
                    {p.badge}
                  </span>
                )}
              </div>

              {/* Product Post Details */}
              <div className="flex-1 flex flex-col justify-between min-w-0 p-[2px] gap-[6px]">
                <div className="flex flex-col gap-[4px]">
                  {/* Seller info row */}
                  <div className="flex items-center gap-[6px]">
                    <img
                      alt={p.sellerName}
                      className="w-5 h-5 rounded-full object-cover"
                      src={p.sellerAvatar}
                    />
                    <span className="font-hanken text-[12px] font-extrabold text-neutral-300 truncate">
                      {p.sellerName}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      • {p.timeAgo}
                    </span>
                  </div>

                  {/* Title and price row */}
                  <div className="flex justify-between items-baseline gap-[8px]">
                    <h4 className="font-chivo text-[12px] xs:text-[14px] font-extrabold text-white truncate">
                      {p.name}
                    </h4>
                    <span className="font-chivo text-[12px] xs:text-[14px] font-extrabold text-white shrink-0">
                      {p.price}
                    </span>
                  </div>

                  {/* Product small descriptions */}
                  <p className="text-neutral-400 font-hanken text-[12px] leading-tight line-clamp-2">
                    {p.desc}
                  </p>
                </div>

                {/* Footer views & action wrapper */}
                <div className="flex items-center justify-between gap-[8px] mt-[4px]">
                  <span className="font-hanken text-[10px] text-zinc-500 lowercase">
                    {p.views} visualizações • {p.location}
                  </span>
                  <button
                    onClick={() => onSelectProduct?.(p)}
                    className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black font-hanken text-[11px] font-black rounded-[8px] transition-all active:scale-95 cursor-pointer leading-none"
                  >
                    Ver Produto
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
