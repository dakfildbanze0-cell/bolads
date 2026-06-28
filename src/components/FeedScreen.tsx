import { useState, ReactNode, useEffect, useRef } from "react";
import { Share2, Check, ShieldAlert, X, Search, ArrowLeft, Heart, MessageCircle, Mic } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORIES } from "../types";

// Fallback products for initialization
export const PRODUCTS: any[] = [];

interface FeedScreenProps {
  onProfileClick?: () => void;
  initialShowSearch?: boolean;
  sortByViews?: boolean;
  isSearchFocused?: boolean;
  onSearchFocusChange?: (focused: boolean) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  products?: any[];
  loading?: boolean;
  error?: string | null;
  onSelectProduct?: (product: any) => void;
  followedSellers?: Record<string, boolean>;
  onToggleFollow?: (sellerName: string) => void;
  bookmarks?: Record<string, boolean>;
  onToggleBookmark?: (product_id: string) => void;
}

export default function FeedScreen({ 
  onProfileClick, 
  initialShowSearch = false,
  sortByViews = false,
  isSearchFocused = false,
  onSearchFocusChange,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  products = [],
  loading = false,
  error = null,
  onSelectProduct,
  followedSellers: externalFollowedSellers,
  onToggleFollow,
  bookmarks: externalBookmarks,
  onToggleBookmark,
}: FeedScreenProps = {}) {
  const [activeTab, setActiveTab] = useState("Para Você");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [localBookmarks, setLocalBookmarks] = useState<Record<string, boolean>>({});
  const bookmarks = externalBookmarks !== undefined ? externalBookmarks : localBookmarks;

  const [localFollowedSellers, setLocalFollowedSellers] = useState<Record<string, boolean>>({});
  const followedSellers = externalFollowedSellers !== undefined ? externalFollowedSellers : localFollowedSellers;
  
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = externalSetSearchQuery !== undefined ? externalSetSearchQuery : setLocalSearchQuery;
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(true);
  const isTransitioningRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeProducts = products;

  useEffect(() => {
    let lastY = window.scrollY;
    let accumulatedDistance = 0;

    const handleScroll = () => {
      if (isTransitioningRef.current) {
        lastY = window.scrollY;
        return;
      }

      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastY;

      if (currentScrollY <= 15) {
        if (!showCategories) {
          isTransitioningRef.current = true;
          setShowCategories(true);
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 320);
        }
        accumulatedDistance = 0;
      } else {
        if (diff > 0) {
          // Scrolling down
          if (accumulatedDistance < 0) accumulatedDistance = 0;
          accumulatedDistance += diff;
          if (accumulatedDistance > 55) {
            if (showCategories) {
              isTransitioningRef.current = true;
              setShowCategories(false);
              setTimeout(() => {
                isTransitioningRef.current = false;
              }, 320);
            }
          }
        } else if (diff < 0) {
          // Scrolling up
          if (accumulatedDistance > 0) accumulatedDistance = 0;
          accumulatedDistance += diff;
          if (accumulatedDistance < -45) {
            if (!showCategories) {
              isTransitioningRef.current = true;
              setShowCategories(true);
              setTimeout(() => {
                isTransitioningRef.current = false;
              }, 320);
            }
          }
        }
      }
      lastY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showCategories]);

  // Random session-stable selection of products with views > 30 to display horizontally
  const [horizontalProductIds] = useState<string[]>(() => {
    const highViewProducts = activeProducts.filter((p) => {
      if (p.views === undefined || p.views === null) return false;
      let val = 0;
      if (typeof p.views === 'number') {
        val = p.views;
      } else {
        const clean = p.views.toString().toLowerCase().trim();
        if (clean.endsWith("k")) {
          val = parseFloat(clean.replace("k", "")) * 1000;
        } else {
          val = parseFloat(clean) || 0;
        }
      }
      return val > 30;
    });
    // Shuffle and pick a portion to be rendered in horizontal mode
    const shuffled = [...highViewProducts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.floor(shuffled.length / 2) + 1).map((p) => p.id);
  });

  const toggleBookmark = (id: string) => {
    if (onToggleBookmark) {
      onToggleBookmark(id);
    } else {
      setLocalBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const handleShare = (p: any) => {
    const shareText = `Confira o produto "${p.name}" por apenas ${p.price}!`;
    if (navigator.share) {
      navigator.share({
        title: p.name,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setCopiedProductId(p.id);
      setTimeout(() => {
        setCopiedProductId(null);
      }, 1500);
    }
  };

  const toggleFollow = (sellerName: string) => {
    if (onToggleFollow) {
      onToggleFollow(sellerName);
    } else {
      setLocalFollowedSellers((prev) => ({
        ...prev,
        [sellerName]: !prev[sellerName],
      }));
    }
  };

  const parseViews = (viewsStr: string | number): number => {
    if (viewsStr === undefined || viewsStr === null) return 0;
    if (typeof viewsStr === 'number') return viewsStr;
    const clean = viewsStr.toString().toLowerCase().trim();
    if (clean.endsWith("k")) {
      return parseFloat(clean.replace("k", "")) * 1000;
    }
    return parseFloat(clean) || 0;
  };

  // Filter products based on selected tab or active search logic
  const filteredProducts = activeProducts.filter((p) => {
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.desc || "").toLowerCase().includes(q)
      );
    }
    
    // Real category matching
    if (activeTab === "Para Você") return true;
    return p.category === activeTab;
  });


  const displayedProducts = sortByViews
    ? [...filteredProducts].sort((a, b) => parseViews(b.views || "") - parseViews(a.views || ""))
    : filteredProducts;

  // Segment products into horizontal scrollable (>30 views) and typical vertical ones
  const horizontalProducts = displayedProducts.filter((p) => horizontalProductIds.includes(p.id));
  const verticalProducts = displayedProducts.filter((p) => !horizontalProductIds.includes(p.id));

  return (
    <div className="flex flex-col gap-[5px] p-[5px] bg-zinc-900 min-h-screen">
        {/* Category Quick Chips - No background, no border */}
        <div className="flex items-center gap-[8px] py-[3px] w-full">
            <div className="flex items-center gap-[8px] overflow-x-auto no-scrollbar flex-1">
              {[ {id: "todos", name: "Para Você"}, ...CATEGORIES ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveTab(cat.name);
                    setSearchQuery(""); // clear search on category select
                  }}
                  className={`font-chivo text-[14px] leading-normal font-medium px-[14px] py-[8px] rounded-[8px] whitespace-nowrap transition-colors active:scale-95 cursor-pointer ${
                    activeTab === cat.name && searchQuery.trim() === ""
                      ? "bg-white text-black font-bold"
                      : "bg-zinc-800 text-neutral-300 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
        </div>

      {/* Sales Feed List */}
      {sortByViews && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-[8px] select-none">
          <span className="font-hanken text-[11px] font-bold text-zinc-300">
            Filtrado por: mais visualizações
          </span>
          <span className="font-hanken text-[10px] text-zinc-500 uppercase font-black">
            Mais Populares
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[5px]">
        {loading ? (
            <div className="col-span-full py-12 text-center text-zinc-500 font-hanken text-xs italic">
                A carregar...
            </div>
        ) : error ? (
            <div className="col-span-full py-12 text-center text-red-500 font-hanken text-xs italic">
                {error}
            </div>
        ) : (() => {
          const elements: ReactNode[] = [];
          
          const carouselElement = horizontalProducts.length > 0 ? (
            <div key="horizontal-carousel" className="col-span-full flex flex-col gap-[5px] w-full overflow-hidden">
              <hr className="border-t border-zinc-800 w-full my-0" />
              <div className="flex gap-[5px] overflow-x-auto no-scrollbar py-1 w-full">
                {horizontalProducts.map((p) => {
                  const isFollowing = !!followedSellers[p.sellerName];
                  return (
                    <article
                      key={p.id}
                      onClick={() => {
                        if (onSelectProduct) {
                          onSelectProduct(p);
                        } else {
                          setSelectedProduct(p);
                        }
                      }}
                      className="w-[calc(100vw-15px)] xs:w-[360px] md:w-[500px] shrink-0 bg-zinc-950 rounded-[8px] p-[5px] flex gap-[5px] h-[350px] overflow-hidden select-none cursor-pointer"
                    >
                      {/* Imagem do produto - Left side with exact bounds */}
                      <div className="w-[130px] xs:w-[155px] sm:w-[45%] h-full relative rounded-[8px] overflow-hidden bg-black shrink-0 flex items-center justify-center">
                        <img
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                          src={p.img}
                          alt={p.name}
                        />
                        
                        {/* Specific Labels matching exactly the supplied layouts */}
                        {p.badge && (
                          <div className="absolute top-[2px] right-[2px]">
                            <span className="bg-black/80 backdrop-blur-md text-white font-chivo text-[10px] font-extrabold px-2 py-0.5">
                              {p.badge}
                            </span>
                          </div>
                        )}
                        
                        {p.localPickup && (
                          <div className="absolute bottom-[2px] left-[2px]">
                            <span className="bg-black/80 text-white font-hanken text-[10px] font-extrabold px-2 py-0.5">
                              Retirada Local
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Details on the right side - Spacings capped to 5px max */}
                      <div className="flex-1 flex flex-col justify-between p-[5px] gap-[5px] min-w-0 h-full">
                        <div className="flex flex-col gap-[5px] min-w-0">
                          {/* Informações do Produto */}
                          <div className="flex flex-col gap-[2px]">
                            <div className="flex items-center justify-between gap-[5px] w-full min-w-0">
                              <div className="flex items-center gap-[6px] min-w-0 flex-1">
                                <img
                                  src={p.sellerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                                  alt={p.sellerName}
                                  className="w-5 h-5 object-cover rounded-full shrink-0 border border-zinc-800"
                                  referrerPolicy="no-referrer"
                                />
                                <h3 className="font-chivo text-[12px] xs:text-[14px] font-extrabold text-white truncate">
                                  {p.name}
                                </h3>
                              </div>
                              <span className="font-chivo text-[12px] xs:text-[14px] font-extrabold text-white shrink-0">
                                {p.price}
                              </span>
                            </div>
                            
                            <p className="text-white opacity-90 font-hanken text-[12px] xs:text-[14px] font-medium line-clamp-2">
                              {p.desc}
                            </p>
                          </div>
                        </div>

                        {/* Visualizações e Ações de Interação (removidos os botões) */}
                      </div>
                    </article>
                  );
                })}
              </div>
              <hr className="border-t border-zinc-800 w-full my-0" />
            </div>
          ) : null;

          // Render loop inserting the carousel row inside verticalProducts at stable index (1)
          const insertIdx = Math.min(1, verticalProducts.length);
          
          if (verticalProducts.length === 0 && carouselElement) {
            elements.push(carouselElement);
          } else {
            verticalProducts.forEach((p, index) => {
              if (index === insertIdx && carouselElement) {
                elements.push(carouselElement);
              }
              const isFollowing = !!followedSellers[p.sellerName];
              elements.push(
                <article
                  key={p.id}
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(p);
                    } else {
                      setSelectedProduct(p);
                    }
                  }}
                  className="bg-transparent group transition-all duration-200 flex flex-col gap-[5px] border-b-2 border-zinc-800 pb-[8px] mb-[8px] cursor-pointer"
                >
                  <div className="relative h-[320px] overflow-hidden bg-black rounded-[8px] flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                      src={p.img}
                      alt={p.name}
                    />
                    
                    {/* Specific Labels matching exactly the supplied layouts */}
                    {p.badge && (
                      <div className="absolute top-[2px] right-[2px]">
                        <span className="bg-black/80 backdrop-blur-md text-white font-chivo text-[10px] font-extrabold px-2 py-0.5">
                          {p.badge}
                        </span>
                      </div>
                    )}
                    
                    {p.localPickup && (
                      <div className="absolute bottom-[2px] left-[2px]">
                        <span className="bg-black/80 text-white font-hanken text-[10px] font-extrabold px-2 py-0.5">
                          Retirada Local
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-[5px] flex flex-col gap-[2px]">
                    <div className="flex justify-between items-start">
                      <h2 className="font-chivo text-[16px] font-extrabold text-white truncate max-w-[70%]">
                        {p.name}
                      </h2>
                      <span className="font-chivo text-[16px] font-extrabold text-white">
                        {p.price}
                      </span>
                    </div>
                    
                    <p className="text-white opacity-90 font-hanken text-[14px] font-medium line-clamp-2">
                      {p.desc}
                    </p>
                    
                    {/* Botões removidos */}
                  </div>
                </article>
              );
            });
            
            // Backup fallback just in case list was too short to perform standard insertion
            if (verticalProducts.length > 0 && verticalProducts.length <= insertIdx && carouselElement) {
              elements.push(carouselElement);
            }
          }
          
          return elements;
        })()}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-400 font-hanken text-xs flex flex-col items-center gap-[5px]">
            <ShieldAlert className="w-8 h-8 text-neutral-500" strokeWidth={2} />
            <span>Nenhum resultado encontrado para "{searchQuery}"</span>
          </div>
        )}
      </div>

      {/* Modern Slide-Up Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-910 border border-zinc-800 rounded-[8px] p-5 w-full max-w-sm flex flex-col gap-[5px] relative text-white bg-black"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative w-full aspect-video rounded-[8px] overflow-hidden bg-black mb-2">
                <img
                  className="w-full h-full object-cover"
                  src={selectedProduct.img}
                  alt={selectedProduct.name}
                />
                {selectedProduct.badge && (
                  <div className="absolute top-[2px] right-[2px]">
                    <span className="bg-black/85 text-white font-chivo text-[10px] font-extrabold px-2 py-0.5">
                      {selectedProduct.badge}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-[3px]">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-chivo text-[20px] font-black text-white leading-tight">
                    {selectedProduct.name}
                  </h3>
                  <span className="font-chivo text-[18px] font-black text-white">
                    {selectedProduct.price}
                  </span>
                </div>
                {selectedProduct.localPickup && (
                  <div>
                    <span className="bg-zinc-800 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 tracking-wider inline-block rounded">
                      Retirada Local Disponível
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[12px] text-neutral-300 font-hanken leading-relaxed mt-1">
                {selectedProduct.desc}
              </div>

              <p className="text-[10px] text-neutral-500 font-hanken uppercase tracking-widest mt-2">
                Vendedor Verificado • {selectedProduct.sellerName}
              </p>

              <button
                onClick={() => setSelectedProduct(null)}
                className="bg-white text-black font-extrabold py-2.5 rounded-[6px] text-xs uppercase tracking-widest transition-all hover:bg-neutral-100 active:scale-[0.98] mt-2 cursor-pointer w-full text-center"
              >
                Fechar Detalhes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
