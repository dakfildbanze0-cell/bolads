import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatPrice } from "./lib/formatPrice";
import {
  Menu,
  User,
  LayoutList,
  MessageSquare,
  Users,
  Settings,
  Eye,
  Lock,
  UserPlus,
  RefreshCw,
  X,
  Search,
  Plus,
  Camera,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  Check,
  Home,
  MessageCircle,
  Bell,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";

import { supabase } from "./lib/supabase";
import { createOrGetConversation, sendMessage, getConversationsListener } from "./lib/chatService";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import FeedScreen from "./components/FeedScreen";
import ProductDetailScreen from "./components/ProductDetailScreen";
import ChatScreen from "./components/ChatScreen";
import ProfileScreen from "./components/ProfileScreen";
import FollowingScreen from "./components/FollowingScreen";
import AlertsScreen from "./components/AlertsScreen";
import ShowcaseScreen from "./components/ShowcaseScreen";
import SettingsScreen from "./components/SettingsScreen";
import PoliciesScreen from "./components/PoliciesScreen";
import SignUpScreen from "./components/SignUpScreen";
import SignInScreen from "./components/SignInScreen";
import RecoveryScreen from "./RecoveryScreen";
import SplashScreen from "./components/SplashScreen";
import AnunciarScreen from "./components/AnunciarScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import MenuScreen from "./components/MenuScreen";
import BugsScreen from "./components/BugsScreen";
import DenunciasScreen from "./components/DenunciasScreen";

const STOCK_ITEMS = [
  {
    name: "Tênis Streetwear Max",
    price: "180 MT",
    desc: "Edição especial com amortecimento responsivo e detalhes reflexivos.",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Headphone Studio Pro",
    price: "299 MT",
    desc: "Cancelamento de ruído ativo profissional com autonomia de 40 horas.",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Relógio Titan Minimalist",
    price: "145 MT",
    desc: "Design escandinavo com pulseira em couro legítimo e caixa ultra fina.",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Óculos Retro Matte Amber",
    price: "95 MT",
    desc: "Proteção UV400 completa, estrutura durável em acetato com acabamento premium.",
    img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80"
  }
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeScreen, setActiveScreen] = useState("feed");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const authCheckedRef = useRef(false);
  const activeScreenRef = useRef(activeScreen);

  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const sessionUser = data?.session?.user || null;
        if (sessionUser) {
          setUser(sessionUser);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
      
      // Fallback: if after 5 seconds onAuthStateChange hasn't fired, 
      // mark as checked anyway so the app doesn't hang on splash
      setTimeout(() => {
        if (mounted && !authCheckedRef.current) {
          console.warn("Auth check fallback triggered");
          setAuthChecked(true);
          authCheckedRef.current = true;
        }
      }, 5000);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log(`[AUTH] Evento: ${event}`, !!session);

      const currentUser = session?.user || null;
      
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);

      // Se for um evento de logout real (sem sessão e sem token no storage)
      if (event === 'SIGNED_OUT' && !currentUser) {
        const publicScreens = ["signin", "signup", "recovery", "onboarding"];
        if (!publicScreens.includes(activeScreenRef.current)) {
          let hasToken = false;
          try {
            hasToken = !!localStorage.getItem('boladas-auth-token');
          } catch(e) {}
          
          if (!hasToken) {
            console.log("[AUTH] Redirecionando para login (Logout confirmado)");
            setActiveScreen("signin");
          }
        }
      }

      setAuthChecked(true);
      authCheckedRef.current = true;
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    // Proactive protection: if auth check is done and we are not logged in, 
    // and we are NOT on a public/auth screen, redirect to signin.
    const publicScreens = ["signin", "signup", "recovery", "onboarding"];
    if (authChecked && !isLoggedIn && !publicScreens.includes(activeScreen)) {
      // Usamos um delay proativo para evitar redirects em flashes de rede
      const checkTimeout = setTimeout(() => {
        if (!mounted) return;
        
        let hasToken = false;
        try {
          hasToken = !!localStorage.getItem('boladas-auth-token');
        } catch (e) {
          console.warn("localStorage inacessível", e);
        }
        
        // Só redireciona se realmente não houver sinal de login após 3 segundos
        if (!isLoggedIn && !hasToken && !publicScreens.includes(activeScreen)) {
          console.log("[AUTH] Redirect proativo executado (Sem sessão detectada)");
          setActiveScreen("signin");
        }
      }, 3000);

      return () => {
        mounted = false;
        clearTimeout(checkTimeout);
      };
    }
    return () => {
      mounted = false;
    };
  }, [activeScreen, isLoggedIn, authChecked]);

  const handleSplashComplete = () => {
    let hasToken = false;
    try {
      hasToken = !!localStorage.getItem('boladas-auth-token');
    } catch(e) {}

    if (isLoggedIn || hasToken) {
      setActiveScreen("feed");
    } else {
      setActiveScreen("signin");
    }
    setShowSplash(false);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnunciarOpen, setIsAnunciarOpen] = useState(false);
  const [sortByViews, setSortByViews] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsSubView, setSettingsSubView] = useState<string | null>(null);
  const [policyType, setPolicyType] = useState<"terms" | "privacy" | null>(null);
  const [activeFCMToast, setActiveFCMToast] = useState<{ senderName: string; text: string } | null>(null);

  useEffect(() => {
    const handlePushEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setActiveFCMToast(detail);
      }
    };
    window.addEventListener("offline-push-received", handlePushEvent);
    return () => {
      window.removeEventListener("offline-push-received", handlePushEvent);
    };
  }, []);

  // Clear toast after 5s
  useEffect(() => {
    if (activeFCMToast) {
      const timer = setTimeout(() => {
        setActiveFCMToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeFCMToast]);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [followedSellers, setFollowedSellers] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setUnreadAlertsCount(0);
      return;
    }

    // Chat and Notifications migration will happen later in their respective services
    // For now, we mock or use placeholders if services aren't updated yet
    const unsubscribe = getConversationsListener(user.id, (convs) => {
      setConversations(convs);
    });
    
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);
        
        if (error) throw error;
        setUnreadAlertsCount(count || 0);
      } catch (err) {
        console.error("Erro completo ao buscar notificações não lidas:", err);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('app_notifications_unread')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFollowedSellers({});
      setBookmarks({});
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, bio, location, phone, isonline, followed_sellers, bookmarks, onboarded, settings')
          .eq('id', user.id)
          .single();

        if (data) {
          setFollowedSellers(data.followed_sellers || {});
          setBookmarks(data.bookmarks || {});
          setUserProfile(data);
        } else if (error && error.code === 'PGRST116') {
          // Profile doesn't exist yet
          const initialProfile = {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário",
            avatar_url: user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
            followed_sellers: {},
            bookmarks: {},
            onboarded: false
          };
          const { error: insertError } = await supabase.from('profiles').insert(initialProfile);
          if (insertError) throw insertError;
          setUserProfile(initialProfile);
        } else if (error) {
          throw error;
        }
      } catch (err) {
        console.error("Erro completo ao buscar/criar perfil:", err);
      }
    };

    fetchProfile();

    const channel = supabase
      .channel(`app_profile_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user.id}` 
      }, (payload) => {
        console.log("Mudança no perfil detectada (Realtime):", payload);
        if (payload.new) {
          const data = payload.new as any;
          setFollowedSellers(data.followed_sellers || {});
          setBookmarks(data.bookmarks || {});
          setUserProfile(data);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Steering/Routing Effect for Onboarding Screen
  useEffect(() => {
    if (!user || !userProfile) return;
    const isProfileIncomplete = 
      userProfile.onboarded === false || 
      !userProfile.name || 
      userProfile.name.trim() === "" || 
      !userProfile.phone || 
      userProfile.phone.trim() === "" ||
      !userProfile.location ||
      userProfile.location.trim() === "";

    if (isProfileIncomplete) {
      if (activeScreen !== "onboarding") {
        setActiveScreen("onboarding");
      }
    } else if (activeScreen === "signin" || activeScreen === "signup" || activeScreen === "onboarding") {
      setActiveScreen("feed");
    }
  }, [user, userProfile, activeScreen]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, description, image_url, images, category, subcategory, views, location, seller_id, created_at, profiles:seller_id(id, name, avatar_url, isonline)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formatted = (data || []).map(p => {
          const profile = (p as any).profiles;
          const productAny = p as any;
          return {
            ...p,
            img: productAny.image_url || productAny.img || productAny.img_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
            timeAgo: p.created_at ? "agora" : "agora",
            desc: productAny.description || productAny.desc || "",
            sellerName: profile?.name || "Vendedor",
            seller_name: profile?.name || "Vendedor",
            sellerAvatar: profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
            sellerPhone: profile?.phone || "+351 912 345 678",
            followers: "4.8k",
            price: formatPrice(p.price)
          };
        });
        setAllProducts(formatted);
      } catch (err) {
        console.error("Erro completo ao buscar produtos:", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();

    const channel = supabase
      .channel('app_products_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleFollowSeller = async (sellerName: string) => {
    if (!user) {
      setActiveScreen("signin");
      return;
    }
    const isFollowing = !!followedSellers[sellerName];
    const newFollowed = { ...followedSellers, [sellerName]: !isFollowing };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ followed_sellers: newFollowed })
        .eq('id', user.id);
      
      if (error) throw error;

      // Find sellerId if possible
      const sellerProduct = allProducts.find(p => p.sellerName === sellerName);
      if (sellerProduct && sellerProduct.seller_id && sellerProduct.seller_id !== user.id) {
        const { sendNotification } = await import("./lib/notifications");
        await sendNotification({
          userId: sellerProduct.seller_id,
          type: "follow",
          title: "Novo seguidor",
          description: `${userProfile?.name || "Alguém"} começou a seguir seu perfil.`,
          senderId: user.id
        });
      }
    } catch (e) {
      console.error("Erro completo ao seguir vendedor:", e);
    }
  };

  const toggleBookmark = async (productId: string) => {
    if (!user) {
      setActiveScreen("signin");
      return;
    }
    const isBookmarked = !!bookmarks[productId];
    const newBookmarks = { ...bookmarks, [productId]: !isBookmarked };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bookmarks: newBookmarks })
        .eq('id', user.id);
      
      if (error) throw error;

      // Notify product owner
      const product = allProducts.find(p => p.id === productId);
      if (product && product.seller_id && product.seller_id !== user.id) {
        const { sendNotification } = await import("./lib/notifications");
        await sendNotification({
          userId: product.seller_id,
          type: "like",
          title: "Interesse no seu produto",
          description: `${userProfile?.name || "Alguém"} favoritou o seu produto ${product.name}.`,
          productName: product.name,
          productId: product.id,
          senderId: user.id
        });
      }
    } catch (e) {
      console.error("Erro completo ao favoritar produto:", e);
    }
  };

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [newProductPhone, setNewProductPhone] = useState("+55 (11) 99888-7711");
  
  // YouTube-style multi-step announce state
  const [uploadStep, setUploadStep] = useState<"media" | "details">("media");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<any>(null);

  const handleSendMessageToSeller = async (messageText: string) => {
    if (!user) {
      setActiveScreen("signin");
      return;
    }
    if (!selectedProduct) return;

    try {
      const sellerId = selectedProduct.seller_id || null;
      const sellerName = selectedProduct.sellerName || "Vendedor";
      const sellerImg = selectedProduct.sellerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

      const conversaId = await createOrGetConversation(
        sellerId,
        sellerName,
        sellerImg,
        selectedProduct
      );

      if (messageText && messageText.trim()) {
        await sendMessage(conversaId, user.id, messageText.trim());
      }

      setActiveChatId(conversaId);
      setActiveScreen("chat");
    } catch (err: any) {
      console.error("Erro completo ao enviar mensagem ao vendedor:", err);
    }
  };

  // Quick navigation config in Portuguese with Sentence Case
  const SCREENS = [
    { id: "feed", name: "1. Início", category: "Feeds principais", icon: Home },
    { id: "alerts", name: "2. Alertas", category: "Feeds principais", icon: Bell },
    { id: "chat", name: "3. Chat", category: "Canais e comunicações", icon: MessageCircle },
    { id: "profile", name: "4. Meu perfil", category: "Perfis", icon: User },
    { id: "showcase", name: "5. Showcase", category: "Perfis", icon: Eye },
    { id: "following", name: "6. Seguindo", category: "Perfis", icon: Users },
    { id: "settings", name: "7. Definições", category: "Configuração", icon: Settings },
    { id: "signin", name: "8. Entrar", category: "Portais de acesso", icon: Lock },
    { id: "signup", name: "9. Cadastrar", category: "Portais de acesso", icon: UserPlus },
    { id: "recovery", name: "10. Recuperar acesso", category: "Portais de acesso", icon: RefreshCw },
  ];

  const isHeaderHidden = activeScreen === "bugs" || activeScreen === "denuncias" || activeScreen === "chat" || activeScreen === "anunciar" || activeScreen === "signin" || activeScreen === "signup" || activeScreen === "recovery" || activeScreen === "onboarding" || activeScreen === "profile" || activeScreen === "settings" || activeScreen === "policies" || activeScreen === "alerts" || activeScreen === "menu";
  const isSidebarHidden = activeScreen === "signin" || activeScreen === "signup" || activeScreen === "recovery" || activeScreen === "onboarding";

  return (
    <div className="bg-zinc-900 min-h-screen text-white font-hanken antialiased relative">
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen authChecked={authChecked} onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {/* 1. Header (Fixed top, h-12 [48px] height) - No borders, no local background - Hidden on chat, anunciar, signin, signup, recovery screens */}
      {!isHeaderHidden && (
        <header className="fixed top-0 left-0 right-0 h-12 bg-zinc-900 flex items-center z-50 border-b border-zinc-800/20">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-3 h-full">
            {isSearchFocused ? (
              /* Global Search Bar Active Layout */
              <div className="flex items-center w-full gap-[8px] h-full animate-fade-in">
                <button
                  onClick={() => {
                    setIsSearchFocused(false);
                    setSearchQuery("");
                  }}
                  className="flex items-center justify-center text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer bg-transparent border-none p-1 shrink-0"
                  title="Voltar"
                >
                  <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
                </button>
                <div className="relative flex-1 bg-zinc-950 border border-zinc-800 rounded-[8px] flex items-center px-3 py-[4px]">
                  <Search className="w-4 h-4 text-zinc-400 mr-[6px] shrink-0" strokeWidth={2.5} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeScreen !== "feed") {
                        setActiveScreen("feed");
                      }
                    }}
                    placeholder="Pesquise O Que Procura..."
                    className="w-full bg-transparent border-none text-white text-[13px] font-hanken font-bold placeholder-zinc-500 focus:outline-none py-0.5"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-zinc-[500] hover:text-white transition-colors cursor-pointer ml-1"
                      title="Limpar"
                    >
                      <X className="w-4 h-4 text-zinc-500" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Standard Header Layout */
              <>
                <div className="flex items-center gap-[5px]">
                  <div className="flex items-center h-[30px] select-none">
                    <img
                      src="/logo-top.pnp.png"
                      alt="Logo"
                      className="h-[35px] max-h-[35px] w-auto object-contain select-none"
                      onError={(e) => {
                        const currentSrc = e.currentTarget.src;
                        if (!currentSrc.includes("dak.png")) {
                          e.currentTarget.src = "/dak.png";
                          return;
                        }
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector(".logo-fallback")) {
                          const fallback = document.createElement("span");
                          fallback.className = "logo-fallback font-chivo text-[24px] font-black leading-none text-white tracking-tighter";
                          fallback.innerText = "";
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Central Top Navigation Tabs */}
                <div className="hidden md:flex items-center gap-[8px] mr-[16px]">
                  <button 
                    onClick={() => {
                      setActiveScreen("feed");
                      setIsSearchFocused(false);
                    }}
                    className={`text-[13px] font-medium transition-opacity ${activeScreen === "feed" && !isSearchFocused ? "text-white" : "text-zinc-500 hover:text-white"}`}>
                    Início
                  </button>
                  <button 
                    onClick={() => setActiveScreen("alerts")}
                    className={`text-[13px] font-medium transition-opacity ${activeScreen === "alerts" ? "text-white" : "text-zinc-500 hover:text-white"}`}>
                    Alertas
                  </button>
                  <button 
                    onClick={() => setActiveScreen("chat")}
                    className={`text-[13px] font-medium transition-opacity ${activeScreen === "chat" ? "text-white" : "text-zinc-500 hover:text-white"}`}>
                    Chat
                  </button>
                </div>

                {/* Central Top Search Bar (Desktop only, with 1.5px border, 8px rounded corners and subtle grey background) */}
                <div className="hidden md:flex relative flex-1 max-w-sm border-[1.5px] border-zinc-800 rounded-[8px] bg-zinc-900/60 flex items-center px-4 py-[3px] transition-all focus-within:border-zinc-700 mx-5">
                  <Search className="w-4 h-4 text-white shrink-0 mr-[5px]" strokeWidth={3.5} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeScreen !== "feed") {
                        setActiveScreen("feed");
                      }
                    }}
                    placeholder="O Que Você Está Procurando?"
                    className="w-full bg-transparent border-none text-white text-[13px] focus:outline-none placeholder-white/80 font-hanken font-bold placeholder:font-bold py-0.5"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-zinc-[500] hover:text-white transition-colors cursor-pointer ml-1"
                      title="Limpar"
                    >
                      <X className="w-4 h-4 text-zinc-500" />
                    </button>
                  )}
                </div>

                {/* Right side icons with bold stroke and 5px separation */}
                <div className="flex items-center gap-[5px]">
                  <button
                    onClick={() => {
                      setActiveScreen("feed");
                      setIsSearchFocused(true);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-white hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
                    title="Buscar"
                  >
                    <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => setActiveScreen("following")}
                    className={`w-8 h-8 flex items-center justify-center text-white hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none ${activeScreen === "following" ? "scale-105" : "opacity-80"} relative`}
                    title="Seguindo"
                  >
                    <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                    <span className="absolute top-[4px] right-[4px] w-2 h-2 rounded-full bg-pink-500 border border-black animate-pulse" />
                  </button>
                  <button
                    onClick={() => setActiveScreen("menu")}
                    className="w-8 h-8 flex items-center justify-center text-white hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
                    title="Menu"
                  >
                    <Menu className="w-5 h-5 text-white" strokeWidth={3.5} />
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
      )}

      {/* 2. Responsive Side-by-Side Main Layout Grid (Capped to max-7xl) - strict 5px column gap */}
      <div className={`w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-[5px] transition-all duration-300 ${isHeaderHidden ? "pt-1 md:pt-2" : "pt-12"} min-h-screen ${isSidebarHidden ? "justify-center" : ""}`}>
        {/* Left Sticky Sidebar for Desktop Viewports */}
        {!isSidebarHidden && (
          <aside className={`hidden md:flex w-64 shrink-0 flex-col gap-[5px] self-start sticky ${isHeaderHidden ? "top-1 h-[calc(100vh-10px)]" : "top-12 h-[calc(100vh-48px)]"} overflow-y-auto no-scrollbar p-[5px]`}>
          {/* User Profile Info block */}
          <div 
            className="bg-zinc-950 p-[12px] flex items-center gap-[5px] rounded-[10px] cursor-pointer hover:bg-zinc-900 transition-colors"
            onClick={() => setActiveScreen("profile")}
          >
            <img
              src={userProfile?.avatar || user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
              alt={userProfile?.name || user?.displayName || "Usuário"}
              className="w-9 h-9 rounded-[8px] object-cover shrink-0"
            />
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-hanken text-[12px] font-black text-white truncate">
                {userProfile?.name || user?.displayName || "Usuário"}
              </span>
              <span className="font-hanken text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">Verificado</span>
            </div>
          </div>

          {/* Quick Announcement Trigger */}
          <button
            onClick={() => {
              setActiveScreen("anunciar");
            }}
            className="w-full bg-zinc-500 text-white py-[7px] rounded-[10px] hover:bg-zinc-600 transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center leading-none shadow-lg"
          >
            <Plus className="w-[16px] h-[16px] text-white shrink-0" strokeWidth={5.5} />
          </button>

          {/* Sidebar Navigation Items list - strict 5px vertical separation */}
          <div className="flex flex-col gap-[5px]">
            {SCREENS.filter(
              (screen) =>
                screen.id !== "settings" &&
                screen.id !== "signin" &&
                screen.id !== "signup" &&
                screen.id !== "recovery"
            ).map((screen) => {
              const ScreenIcon = screen.icon;
              const isActive = activeScreen === screen.id;
              const hasAlerts = screen.id === "alerts" && unreadAlertsCount > 0;
              return (
                <button
                  key={screen.id}
                  onClick={() => setActiveScreen(screen.id)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-[8px] text-left transition-all duration-150 font-hanken text-[11px] uppercase tracking-wider font-medium cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? "bg-zinc-900 text-white font-medium border-l-[3.5px] border-white pl-[8.5px]"
                      : "text-neutral-400 hover:text-white hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center gap-[8px] min-w-0">
                    <ScreenIcon className={`w-3.5 h-3.5 shrink-0 ${hasAlerts ? "text-rose-500 fill-rose-500/20" : "text-white"}`} strokeWidth={isActive ? 2.5 : 2.0} />
                    <span className="truncate">{screen.name}</span>
                  </div>
                  {hasAlerts && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-[4px] py-[1px] rounded-full min-w-[16px] text-center shrink-0">
                      {unreadAlertsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      )}

        {/* Center / Right Core Application Container */}
        <main className={`flex-1 w-full min-w-0 ${isHeaderHidden ? "pb-[5px]" : "pb-16"} px-[2px] flex flex-col gap-[5px]`}>
          {(activeScreen === "feed" || activeScreen === "search") && (
            <FeedScreen
              products={allProducts}
              loading={loadingProducts}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setActiveScreen("product_detail");
              }}
              onProfileClick={() => setActiveScreen("profile")}
              initialShowSearch={activeScreen === "search"}
              sortByViews={sortByViews}
              isSearchFocused={isSearchFocused}
              onSearchFocusChange={setIsSearchFocused}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              followedSellers={followedSellers}
              onToggleFollow={toggleFollowSeller}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
            />
          )}
          {activeScreen === "product_detail" && (
            <ProductDetailScreen
              product={selectedProduct}
              onBack={() => setActiveScreen("feed")}
              onSendMessage={handleSendMessageToSeller}
              allProducts={allProducts}
              onSelectProduct={setSelectedProduct}
              isFollowed={!!followedSellers[selectedProduct?.sellerName]}
              onToggleFollowSeller={toggleFollowSeller}
              isBookmarked={!!bookmarks[selectedProduct?.id]}
              onToggleBookmark={toggleBookmark}
              currentUser={user}
            />
          )}
          {activeScreen === "chat" && (
            <ChatScreen
              conversations={conversations}
              setConversations={setConversations}
              activeChatId={activeChatId}
              setActiveChatId={setActiveChatId}
              currentUser={user}
              onBack={() => {
                if (activeChatId) {
                  setActiveChatId(null);
                } else {
                  setActiveScreen("feed");
                }
              }}
            />
          )}
          {activeScreen === "profile" && (
            <ProfileScreen
              currentUser={user}
              onBack={() => setActiveScreen("feed")}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setActiveScreen("product_detail");
              }}
            />
          )}
          {activeScreen === "following" && (
            <FollowingScreen
              products={allProducts}
              followedSellers={followedSellers}
              onToggleFollow={toggleFollowSeller}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setActiveScreen("product_detail");
              }}
            />
          )}
          {activeScreen === "showcase" && <ShowcaseScreen />}
          {activeScreen === "anunciar" && (
            <AnunciarScreen
              userProfile={userProfile}
              onBack={() => setActiveScreen("feed")}
              onProductCreated={(newProd) => {
                const formatted = {
                  ...newProd,
                  img: newProd.image_url || newProd.img || newProd.img_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
                  timeAgo: "agora",
                  desc: newProd.description || newProd.desc || "",
                  sellerName: userProfile?.name || "Vendedor",
                  seller_name: userProfile?.name || "Vendedor",
                  sellerAvatar: userProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
                  sellerPhone: userProfile?.phone || "+351 912 345 678",
                  followers: "4.8k",
                  price: formatPrice(newProd.price)
                };
                
                // Add to feed instantly without reloading
                setAllProducts((prev) => [formatted, ...prev]);
                
                // Immediately open the newly created product detail screen
                setSelectedProduct(formatted);
                setActiveScreen("product_detail");
              }}
            />
          )}
          {activeScreen === "settings" && (
            <SettingsScreen
              userProfile={userProfile}
              user={user}
              onBack={() => {
                setActiveScreen("feed");
                setSettingsSubView(null);
              }}
              initialSubView={settingsSubView}
            />
          )}
          {activeScreen === "alerts" && (
            <AlertsScreen
              products={allProducts}
              currentUser={user}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setActiveScreen("product_detail");
              }}
              onBack={() => setActiveScreen("feed")}
            />
          )}
          
          {activeScreen === "menu" && (
            <MenuScreen
              onBack={() => setActiveScreen("feed")}
              onNavigate={(screen, subView) => {
                setActiveScreen(screen);
                if (screen === "settings") {
                  setSettingsSubView(subView || null);
                }
              }}
            />
          )}

          {activeScreen === "bugs" && (
            <BugsScreen
              user={user}
              userProfile={userProfile}
              onBack={() => setActiveScreen("menu")}
            />
          )}

          {activeScreen === "denuncias" && (
            <DenunciasScreen
              user={user}
              userProfile={userProfile}
              onBack={() => setActiveScreen("menu")}
            />
          )}
          
          {activeScreen === "onboarding" && (
            <OnboardingScreen
              user={user}
              userProfile={userProfile}
              onComplete={() => {
                setActiveScreen("feed");
              }}
            />
          )}

          {activeScreen === "policies" && policyType && (
            <PoliciesScreen type={policyType} onBack={() => setActiveScreen("signin")} />
          )}
          {activeScreen === "signin" && (
            <SignInScreen
              onLoginSuccess={() => {
                setIsLoggedIn(true);
                setActiveScreen("feed");
              }}
              onGoToSignUp={() => setActiveScreen("signup")}
              onGoToRecovery={() => setActiveScreen("recovery")}
              onOpenPolicies={(type) => {
                setPolicyType(type);
                setActiveScreen("policies");
              }}
            />
          )}
          {activeScreen === "signup" && (
            <SignUpScreen 
               onGoToLogin={() => setActiveScreen("signin")} 
               onOpenPolicies={(type) => {
                 setPolicyType(type);
                 setActiveScreen("policies");
               }}
            />
          )}
          {activeScreen === "recovery" && (
            <RecoveryScreen onBackToLogin={() => setActiveScreen("signin")} />
          )}
        </main>
      </div>

      {/* 3. Mobile Navigation Bar (Fixed bottom, 64px height, hidden on desktop screens) */}
      {!isHeaderHidden && (
        <nav className="fixed bottom-0 w-full h-16 bg-zinc-900 flex md:hidden items-center justify-around px-2 z-40 max-w-md left-1/2 -translate-x-1/2 border-t border-zinc-800">
          <button
            className="flex flex-col items-center gap-1 py-1 transition-all text-white hover:opacity-90 animate-none cursor-pointer"
            onClick={() => setActiveScreen("feed")}
          >
            <Home className={`w-6 h-6 text-white ${activeScreen === "feed" ? "scale-105" : "opacity-80"}`} strokeWidth={2.5} />
            <span className={`text-[9px] font-medium font-hanken tracking-wider leading-none text-white ${activeScreen === "feed" ? "opacity-100" : "opacity-80"}`}>
              Início
            </span>
          </button>
 
          <button
            className="flex flex-col items-center gap-1 py-1 transition-all text-white hover:opacity-90 animate-none cursor-pointer relative"
            onClick={() => setActiveScreen("alerts")}
          >
            <Bell className={`w-6 h-6 text-white ${activeScreen === "alerts" ? "scale-105 animate-pulse" : "opacity-80"} ${unreadAlertsCount > 0 ? "text-rose-500 fill-rose-500/20" : ""}`} strokeWidth={2.5} />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-0 -right-[4px] min-w-[16px] h-[16px] rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center border-none px-[2px]">
                {unreadAlertsCount}
              </span>
            )}
            <span className={`text-[9px] font-medium font-hanken tracking-wider leading-none text-white ${activeScreen === "alerts" ? "opacity-100" : "opacity-80"}`}>
              Alertas
            </span>
          </button>
 
          {/* Centralized Upload/Subir Button with wider black background, grey/white styling (no pink), perfectly vertically centered on the same line */}
          <button
            className={`flex items-center justify-center w-16 h-10 bg-black rounded-[8px] shadow-lg transition-all active:scale-95 duration-200 cursor-pointer border-t-2 border-t-white border-b-4 border-b-zinc-400 border-l border-l-white/40 border-r border-r-zinc-650/40 hover:brightness-110 ${
              activeScreen === "anunciar" ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
            }`}
            onClick={() => setActiveScreen("anunciar")}
            title="Subir"
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
          </button>
 
          <button
            className="flex flex-col items-center gap-1 py-1 transition-all text-white hover:opacity-90 animate-none cursor-pointer relative"
            onClick={() => setActiveScreen("chat")}
          >
            <MessageCircle className={`w-6 h-6 text-white ${activeScreen === "chat" ? "scale-105" : "opacity-80"}`} strokeWidth={2.5} />
            {conversations.reduce((acc, c) => acc + (c.unread || 0), 0) > 0 && (
              <span className="absolute top-[2px] right-[6px] min-w-[16px] h-[16px] rounded-full bg-pink-500 text-white text-[10px] font-extrabold flex items-center justify-center border-none px-[2px]">
                {conversations.reduce((acc, c) => acc + (c.unread || 0), 0)}
              </span>
            )}
            <span className={`text-[9px] font-medium font-hanken tracking-wider leading-none text-white ${activeScreen === "chat" ? "opacity-100" : "opacity-80"}`}>
              Chat
            </span>
          </button>
 
          <button
            className="flex flex-col items-center gap-1 py-1 transition-all text-white hover:opacity-90 animate-none cursor-pointer"
            onClick={() => setActiveScreen("profile")}
          >
            <User className={`w-6 h-6 text-white ${activeScreen === "profile" ? "scale-105" : "opacity-80"}`} strokeWidth={2.5} />
            <span className={`text-[9px] font-medium font-hanken tracking-wider leading-none text-white ${activeScreen === "profile" ? "opacity-100" : "opacity-80"}`}>
              Perfil
            </span>
          </button>
        </nav>
      )}

      {/* Floating simulated FCM Push Notification Toast */}
      <AnimatePresence>
        {activeFCMToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-zinc-950/95 border border-zinc-800 rounded-[8px] p-3 max-w-[90vw] w-[340px] shadow-2xl flex items-start gap-3"
          >
            <div className="w-8 h-8 bg-pink-500 rounded-[8px] shrink-0 flex items-center justify-center text-white font-black text-sm">
              <MessageSquare className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-chivo text-xs font-black text-white leading-tight">
                {activeFCMToast.senderName}
              </h4>
              <p className="font-hanken text-xs text-zinc-300 mt-1 line-clamp-2">
                {activeFCMToast.text}
              </p>
            </div>
            <button
              onClick={() => setActiveFCMToast(null)}
              className="text-zinc-[500] hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
