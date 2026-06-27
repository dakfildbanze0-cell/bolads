import { useState, useEffect } from "react";
import { Search, Sliders, CheckSquare, User, Eye, Heart } from "lucide-react";
import { supabase } from "../lib/supabase";

interface FollowingScreenProps {
  products?: any[];
  followedSellers?: Record<string, boolean>;
  onToggleFollow?: (sellerNameOrId: string) => void;
  onSelectProduct?: (product: any) => void;
  onViewSellerProfile?: (sellerId: string) => void;
  currentUser?: any;
}

export default function FollowingScreen({
  products = [],
  followedSellers = {},
  onToggleFollow,
  onSelectProduct,
  onViewSellerProfile,
  currentUser,
}: FollowingScreenProps) {
  const [query, setQuery] = useState("");
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, location, followed_sellers");
        if (data) {
          setAllProfiles(data);
        }
      } catch (err) {
        console.error("Erro Ao Buscar Perfis Na Tela Seguindo:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();

    // Sincronização em tempo real das alterações em perfis (seguidores/seguindo)
    const channel = supabase
      .channel("following_screen_profiles_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatText = (str: string) => {
    if (!str) return "";
    return str
      .split(/\s+/)
      .map((word) => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  const getFollowersCount = (profileName: string, profileId: string) => {
    return allProfiles.filter((p) => {
      const followed = p.followed_sellers || {};
      return followed[profileName] === true || followed[profileId] === true;
    }).length;
  };

  const getLastProduct = (sellerName: string, sellerId: string) => {
    // Filtrar produtos deste vendedor
    const sellerProducts = products.filter(
      (p) => p.seller_id === sellerId || p.sellerName === sellerName
    );
    return sellerProducts[0] || null;
  };

  // Vendedores seguidos
  const followedSellersList = allProfiles.filter((p) => {
    if (currentUser && p.id === currentUser.id) return false;
    const isFollowing = followedSellers[p.name] === true || followedSellers[p.id] === true;
    return isFollowing && p.name?.toLowerCase().includes(query.toLowerCase());
  });

  // Vendedores recomendados (para seguir)
  const recommendedSellersList = allProfiles.filter((p) => {
    if (currentUser && p.id === currentUser.id) return false;
    const isFollowing = followedSellers[p.name] === true || followedSellers[p.id] === true;
    return !isFollowing && p.name?.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-[8px] p-[8px] w-full animate-fade-in text-white bg-zinc-900 min-h-screen">
      {/* Header Section - Max 8px spacing */}
      <section className="py-[4px] flex flex-col gap-[4px]">
        <h2 className="font-chivo text-[18px] md:text-[24px] font-black leading-none text-white">
          Seguindo
        </h2>
        <p className="font-hanken text-[11px] text-neutral-400 font-bold leading-none">
          Postagens E Atualizações De Quem Tu Segues
        </p>
      </section>

      {/* Search Bar - Max 8px separation */}
      <div className="flex gap-[8px] items-center bg-zinc-950/40 p-[4px] rounded-[8px] border border-zinc-800/10">
        <div className="relative flex-1 bg-transparent">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Search className="w-4 h-4 text-neutral-400" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 outline-none border-none font-hanken"
            placeholder="Filtrar Vendedores..."
            type="text"
          />
        </div>
        <button className="bg-transparent px-2 flex items-center justify-center text-white outline-none border-none cursor-pointer">
          <Sliders className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* SECTION 1: Vendedores Seguidos (Requisito 4) */}
      <div className="flex flex-col gap-[6px]">
        <h3 className="font-chivo text-[12px] font-bold text-neutral-300">
          Vendedores Que Segues
        </h3>

        {loading ? (
          <div className="flex justify-center py-[20px]">
            <span className="text-xs text-neutral-400 animate-pulse font-hanken">Carregando Vendedores...</span>
          </div>
        ) : followedSellersList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-[16px] text-center rounded-[8px] border border-zinc-800/30 border-dashed gap-[4px]">
            <Heart className="w-5 h-5 text-neutral-600" />
            <p className="font-hanken text-[11px] text-neutral-500">
              Ainda Não Segues Nenhum Vendedor Ativo.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[8px] w-full">
            {followedSellersList.map((seller) => {
              const followersCount = getFollowersCount(seller.name, seller.id);
              const lastProduct = getLastProduct(seller.name, seller.id);

              return (
                <div
                  key={seller.id}
                  className="flex flex-col gap-[6px] p-[8px] bg-zinc-950/30 rounded-[8px] border border-zinc-800/10 hover:border-zinc-800/30 transition-all"
                >
                  {/* Seller Header Row */}
                  <div className="flex items-center justify-between gap-[8px]">
                    <div className="flex items-center gap-[8px] min-w-0">
                      <img
                        alt={seller.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                        src={seller.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-hanken text-[13px] font-bold text-white truncate leading-tight">
                          {formatText(seller.name)}
                        </span>
                        <span className="font-hanken text-[10px] text-zinc-500 leading-none mt-0.5">
                          {followersCount} {followersCount === 1 ? "Seguidor" : "Seguidores"}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons with max 8px spacing */}
                    <div className="flex items-center gap-[6px] shrink-0">
                      <button
                        onClick={() => onViewSellerProfile?.(seller.id)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white font-hanken text-[10px] font-bold rounded-[6px] transition-all active:scale-95 cursor-pointer border-none"
                      >
                        Ver Perfil
                      </button>
                      <button
                        onClick={() => onToggleFollow?.(seller.id)}
                        className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 font-hanken text-[10px] font-bold rounded-[6px] transition-all active:scale-95 cursor-pointer border border-rose-900/20"
                      >
                        Deixar De Seguir
                      </button>
                    </div>
                  </div>

                  {/* Last Product Card */}
                  {lastProduct ? (
                    <div 
                      onClick={() => onSelectProduct?.(lastProduct)}
                      className="flex gap-[8px] p-[6px] bg-zinc-900/40 rounded-[6px] border border-zinc-850 cursor-pointer hover:bg-zinc-900/65 transition-colors items-center"
                    >
                      <img
                        src={lastProduct.img}
                        alt={lastProduct.name}
                        className="w-10 h-10 object-cover rounded-[4px] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                        <span className="text-[9px] text-zinc-400 font-bold font-hanken uppercase tracking-wider leading-none">Último Anúncio</span>
                        <h4 className="font-chivo text-[11px] font-extrabold text-white truncate leading-tight">
                          {formatText(lastProduct.name)}
                        </h4>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-chivo text-[11px] font-extrabold text-white block">
                          {lastProduct.price}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-[4px] px-[6px] bg-zinc-900/20 rounded-[6px] border border-zinc-850/50">
                      <span className="font-hanken text-[10px] text-zinc-500">Este Vendedor Ainda Não Tem Anúncios Publicados.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Vendedores recomendados */}
      <div className="flex flex-col gap-[6px] mt-2">
        <h3 className="font-chivo text-[12px] font-bold text-neutral-300">
          Vendedores Recomendados
        </h3>

        {loading ? (
          <div className="flex justify-center py-[20px]">
            <span className="text-xs text-neutral-400 animate-pulse font-hanken">Carregando Sugestões...</span>
          </div>
        ) : recommendedSellersList.length === 0 ? (
          <div className="flex items-center justify-center p-[12px] text-center rounded-[8px] border border-zinc-800/30 border-dashed">
            <p className="font-hanken text-[11px] text-neutral-500">
              Não Há Outros Vendedores Para Exibir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px] w-full">
            {recommendedSellersList.slice(0, 4).map((seller) => {
              const followersCount = getFollowersCount(seller.name, seller.id);

              return (
                <div
                  key={seller.id}
                  className="flex items-center justify-between gap-[8px] p-[8px] bg-zinc-950/20 rounded-[8px] border border-zinc-800/10"
                >
                  <div className="flex items-center gap-[8px] min-w-0">
                    <img
                      alt={seller.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                      src={seller.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-hanken text-[12px] font-bold text-white truncate leading-tight">
                        {formatText(seller.name)}
                      </span>
                      <span className="font-hanken text-[9px] text-neutral-500 leading-none mt-0.5">
                        {followersCount} {followersCount === 1 ? "Seguidor" : "Seguidores"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleFollow?.(seller.id)}
                    className="font-hanken text-[10px] font-bold px-3 py-1 bg-white text-zinc-950 rounded-[6px] active:scale-95 hover:opacity-90 transition-all cursor-pointer border-none"
                  >
                    Seguir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Publicações de quem segue */}
      <div className="flex flex-col gap-[6px] mt-2">
        <h3 className="font-chivo text-[12px] font-bold text-neutral-300">
          Publicações Recentes De Quem Segues
        </h3>

        {(() => {
          const followedPosts = products.filter((p) => {
            return followedSellers[p.sellerName] === true || (p.seller_id && followedSellers[p.seller_id] === true);
          });

          if (followedPosts.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center p-[20px] text-center gap-[4px] rounded-[8px] border border-zinc-800/30 border-dashed">
                <CheckSquare className="w-6 h-6 text-neutral-600" />
                <p className="font-hanken text-[11px] text-neutral-500 max-w-[240px]">
                  Nenhum Anúncio Ativo. Segue Vendedores Ativos No Topo Para Veres Os Anúncios Deles Aqui.
                </p>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-[8px] w-full">
              {followedPosts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct?.(p)}
                  className="flex gap-[8px] p-[8px] rounded-[8px] bg-zinc-950/20 hover:bg-zinc-950/40 border border-zinc-800/5 cursor-pointer transition-all"
                >
                  <img
                    alt={p.name}
                    className="w-16 h-16 object-cover rounded-[6px] shrink-0"
                    src={p.img}
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between p-[2px]">
                    <div className="flex flex-col gap-[2px]">
                      <div className="flex items-center gap-[4px]">
                        <img
                          alt={p.sellerName}
                          className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                          src={p.sellerAvatar}
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-hanken text-[10px] font-bold text-zinc-400 truncate">
                          {formatText(p.sellerName)}
                        </span>
                      </div>
                      <h4 className="font-chivo text-[12px] font-extrabold text-white truncate leading-tight mt-0.5">
                        {formatText(p.name)}
                      </h4>
                    </div>
                    <span className="font-chivo text-[12px] font-extrabold text-white block mt-1">
                      {p.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
