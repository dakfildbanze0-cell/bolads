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
  PanelLeftClose,
  PanelLeftOpen,
  Bug,
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
import InstallPWA from "./components/InstallPWA";

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
  const [activeScreen, setActiveScreen] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const validScreens = [
      "feed", "alerts", "chat", "profile", "showcase", "following", "settings", 
      "signin", "signup", "recovery", "anunciar", "bugs", "denuncias", "menu", "policies", "search", "product_detail", "onboarding"
    ];
    if (validScreens.includes(hash)) return hash;
    if (hash.startsWith("product/")) return "product_detail";
    if (hash.startsWith("profile/")) return "profile";
    return "feed";
  });
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const authCheckedRef = useRef(false);
  const activeScreenRef = useRef(activeScreen);

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

  useEffect(() => {
    const fetchAllProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, followed_sellers");
        if (data) {
          setAllProfiles(data);
        }
      } catch (err) {
        console.error("Erro ao buscar perfis na barra lateral:", err);
      }
    };

    fetchAllProfiles();

    const channel = supabase
      .channel("sidebar_profiles_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchAllProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    activeScreenRef.current = activeScreen;
    if (activeScreen) {
      if (activeScreen === "product_detail" && selectedProduct?.id) {
        window.location.hash = `product/${selectedProduct.id}`;
      } else if (activeScreen === "profile" && viewingProfileUserId) {
        window.location.hash = `profile/${viewingProfileUserId}`;
      } else {
        window.location.hash = activeScreen;
      }
    }
  }, [activeScreen, selectedProduct, viewingProfileUserId]);

  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash !== activeScreenRef.current && hash !== `product/${selectedProduct?.id}` && hash !== `profile/${viewingProfileUserId}`) {
        if (hash.startsWith("product/")) {
          const productId = hash.split("/")[1];
          if (productId) {
            try {
              const { data, error } = await supabase.from('produtos').select('*').eq('id', productId).single();
              if (data && !error) {
                setSelectedProduct(data);
                setActiveScreen("product_detail");
                return;
              }
            } catch (err) {
              console.error(err);
            }
          }
        } else if (hash.startsWith("profile/")) {
          const profileId = hash.split("/")[1];
          if (profileId) {
            setViewingProfileUserId(profileId);
            setActiveScreen("profile");
            return;
          }
        }
        
        const validScreens = [
          "feed", "alerts", "chat", "profile", "showcase", "following", "settings", 
          "signin", "signup", "recovery", "anunciar", "bugs", "denuncias", "menu", "policies", "search", "product_detail", "onboarding"
        ];
        if (validScreens.includes(hash)) {
          setActiveScreen(hash);
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    
    // Set initial activeScreen from hash if present on mount
    const initialHash = window.location.hash.replace("#", "");
    if (initialHash) {
      handleHashChange();
    }

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [selectedProduct, viewingProfileUserId]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          const sessionUser = session?.user || null;
          setUser(sessionUser);
          setIsLoggedIn(!!sessionUser);
          setAuthChecked(true);
          authCheckedRef.current = true;
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) {
          setAuthChecked(true);
          authCheckedRef.current = true;
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Ignorar atualizações de token para evitar loops de renderização e recriação de canais
      if (event === 'TOKEN_REFRESHED') return;

      const currentUser = session?.user || null;
      
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);

      if (event === 'SIGNED_OUT') {
        const publicScreens = ["signin", "signup", "recovery", "onboarding"];
        if (!publicScreens.includes(activeScreenRef.current)) {
          console.log("[AUTH] Logout detectado, redirecionando para Login");
          setActiveScreen("signin");
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
    // Redirection protection
    const publicScreens = ["signin", "signup", "recovery", "onboarding", "policies"];
    if (authChecked && !isLoggedIn && !publicScreens.includes(activeScreen)) {
      setActiveScreen("signin");
    }
  }, [activeScreen, isLoggedIn, authChecked]);

  const handleSplashComplete = () => {
    const initialHash = window.location.hash.replace("#", "");
    const validScreens = [
      "feed", "alerts", "chat", "profile", "showcase", "following", "settings", 
      "signin", "signup", "recovery", "anunciar", "bugs", "denuncias", "menu", "policies", "search", "product_detail", "onboarding"
    ];
    if (initialHash && (validScreens.includes(initialHash) || initialHash.startsWith("product/") || initialHash.startsWith("profile/"))) {
      const isPublic = ["signin", "signup", "recovery", "onboarding", "policies"].includes(initialHash) || initialHash.startsWith("product/") || initialHash.startsWith("profile/");
      if (isLoggedIn || isPublic) {
        // activeScreen is handled by handleHashChange, so we just hide splash
        setShowSplash(false);
        return;
      }
    }

    if (isLoggedIn) {
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

  const getOrderedProductsForFeed = () => {
    if (!user || Object.keys(followedSellers).length === 0) {
      return allProducts;
    }
    // Ordenar produtos: vendedores seguidos primeiro. Mantendo data ou visualizações como critério secundário.
    return [...allProducts].sort((a, b) => {
      const isASelected = !!followedSellers[a.sellerName] || (a.seller_id && !!followedSellers[a.seller_id]);
      const isBSelected = !!followedSellers[b.sellerName] || (b.seller_id && !!followedSellers[b.seller_id]);

      if (isASelected && !isBSelected) return -1;
      if (!isASelected && isBSelected) return 1;
      
      if (sortByViews) {
        return (b.views || 0) - (a.views || 0);
      }
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const toggleFollowSeller = async (sellerNameOrId: string) => {
    if (!user) {
      setActiveScreen("signin");
      return;
    }

    // Tentar descobrir se o argumento é um UUID ou nome
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sellerNameOrId);
    let sellerId = isUuid ? sellerNameOrId : null;
    let sellerName = isUuid ? null : sellerNameOrId;

    // Resolver Nome e ID com base nos produtos ou perfis
    if (sellerId && !sellerName) {
      const prod = allProducts.find(p => p.seller_id === sellerId);
      if (prod) {
        sellerName = prod.sellerName;
      }
    } else if (sellerName && !sellerId) {
      const prod = allProducts.find(p => p.sellerName === sellerName);
      if (prod) {
        sellerId = prod.seller_id;
      }
    }

    // Se ainda não resolveu e é UUID, vamos tentar buscar o nome do perfil
    if (sellerId && !sellerName) {
      try {
        const { data } = await supabase.from('profiles').select('name').eq('id', sellerId).single();
        if (data) {
          sellerName = data.name;
        }
      } catch (err) {
        console.error("Erro ao buscar nome do vendedor:", err);
      }
    }

    const finalSellerId = sellerId;
    const finalSellerName = sellerName || "Vendedor";

    // Requisito 11: Não permitir que um usuário siga a si mesmo
    if (finalSellerId && finalSellerId === user.id) {
      alert("Não podes seguir o teu próprio perfil.");
      return;
    }

    // Requisito 10: Evitar duplicados. Verificar se já segue
    const key = finalSellerName;
    const isFollowing = !!followedSellers[key] || (finalSellerId ? !!followedSellers[finalSellerId] : false);

    // Estado otimista para atualização imediata (Requisito 1)
    const newFollowed = { ...followedSellers };
    if (isFollowing) {
      delete newFollowed[key];
      if (finalSellerId) delete newFollowed[finalSellerId];
    } else {
      newFollowed[key] = true;
      if (finalSellerId) newFollowed[finalSellerId] = true;
    }
    setFollowedSellers(newFollowed);

    try {
      // 1. Tentar salvar na tabela de follows se finalSellerId existir
      let savedInFollowsTable = false;
      if (finalSellerId) {
        if (isFollowing) {
          // Deixar de seguir
          const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', finalSellerId);
          
          if (!error) {
            savedInFollowsTable = true;
          } else {
            console.warn("Erro ao deletar de follows (usando fallback):", error);
          }
        } else {
          // Seguir
          const { error } = await supabase
            .from('follows')
            .insert({
              follower_id: user.id,
              following_id: finalSellerId
            });
          
          if (!error) {
            savedInFollowsTable = true;
          } else {
            // Se for erro de restrição única (já existe), não lançar erro grave
            if (error.code === '23505') {
              savedInFollowsTable = true;
            } else {
              console.warn("Erro ao inserir em follows (usando fallback):", error);
            }
          }
        }
      }

      // 2. Sempre manter sincronizado também na coluna JSONB de profiles para garantir compatibilidade completa
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ followed_sellers: newFollowed })
        .eq('id', user.id);

      if (profileError && !savedInFollowsTable) {
        throw profileError;
      }

      // Requisito 6: Criar notificações automáticas ("Fulano começou a seguir você.")
      if (!isFollowing && finalSellerId && finalSellerId !== user.id) {
        const { sendNotification } = await import("./lib/notifications");
        await sendNotification({
          user_id: finalSellerId,
          type: "follow",
          title: "Novo seguidor",
          description: `${userProfile?.name || "Alguém"} começou a seguir o teu perfil.`,
          senderId: user.id
        });
      }

    } catch (e: any) {
      console.error("Erro completo ao seguir vendedor:", e);
      // Reverter estado local em caso de erro real (Tratamento de erros - Requisito 13)
      setFollowedSellers(followedSellers);
      alert("Falha de ligação ao tentar seguir o vendedor. Por favor, tenta novamente.");
    }
  };

  const toggleBookmark = async (product_id: string) => {
    if (!user) {
      setActiveScreen("signin");
      return;
    }
    const isBookmarked = !!bookmarks[product_id];
    const newBookmarks = { ...bookmarks, [product_id]: !isBookmarked };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bookmarks: newBookmarks })
        .eq('id', user.id);
      
      if (error) throw error;

      // Notify product owner
      const product = allProducts.find(p => p.id === product_id);
      if (product && product.seller_id && product.seller_id !== user.id) {
        const { sendNotification } = await import("./lib/notifications");
        await sendNotification({
          user_id: product.seller_id,
          type: "like",
          title: "Interesse no seu produto",
          description: `${userProfile?.name || "Alguém"} favoritou o seu produto ${product.name}.`,
          productName: product.name,
          product_id: product.id,
          senderId: user.id
        });
      }
    } catch (e) {
      console.error("Erro completo ao favoritar produto:", e);
    }
  };

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
      const seller_id = selectedProduct.seller_id || null;
      const sellerName = selectedProduct.sellerName || "Vendedor";
      const sellerImg = selectedProduct.sellerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

      const conversaId = await createOrGetConversation(
        seller_id,
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

  const handleStartChatWithUser = async (targetUserId: string, targetUserName: string, targetUserAvatar: string, initialProduct: any = null) => {
    if (!user) {
      setActiveScreen("signin");
      return;
    }
    try {
      const conversaId = await createOrGetConversation(
        targetUserId,
        targetUserName,
        targetUserAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        initialProduct
      );
      setActiveChatId(conversaId);
      setActiveScreen("chat");
    } catch (err) {
      console.error("Erro ao iniciar conversa:", err);
    }
  };

  // Quick navigation config in Portuguese with Sentence Case
  const SCREENS = [
    { id: "feed", name: "Início", category: "Feeds principais", icon: Home },
    { id: "alerts", name: "Alertas", category: "Feeds principais", icon: Bell },
    { id: "chat", name: "Chat", category: "Canais e comunicações", icon: MessageCircle },
    { id: "profile", name: "Meu perfil", category: "Perfis", icon: User },
    { id: "showcase", name: "Showcase", category: "Perfis", icon: Eye },
    { id: "following", name: "Seguindo", category: "Perfis", icon: Users },
    { id: "settings", name: "Definições", category: "Configuração", icon: Settings },
    { id: "suporte_ajuda", name: "Suporte e ajuda", category: "Configuração", icon: HelpCircle },
    { id: "bugs", name: "Informar bug", category: "Configuração", icon: Bug },
    { id: "denuncias", name: "Painel de denúncias", category: "Configuração", icon: ShieldAlert },
    { id: "signin", name: "Entrar", category: "Portais de acesso", icon: Lock },
    { id: "signup", name: "Cadastrar", category: "Portais de acesso", icon: UserPlus },
    { id: "recovery", name: "Recuperar acesso", category: "Portais de acesso", icon: RefreshCw },
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
                <div className="flex items-center gap-[8px]">
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

                {/* Right side placeholder */}
                <div className="flex items-center gap-[8px]">
                  <a
                    href="#anunciar"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveScreen("anunciar");
                    }}
                    className="hidden md:flex items-center gap-[6px] px-[12px] py-[6px] bg-white text-black hover:bg-zinc-200 transition-colors rounded-[8px] no-underline font-hanken font-bold text-[13px] cursor-pointer shadow-md"
                    title="Subir"
                  >
                    <Plus className="w-[16px] h-[16px]" strokeWidth={3} />
                    Subir
                  </a>
                  {!isSidebarHidden && (
                    <button
                      onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                      className="hidden md:flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer shadow-none"
                      title={isLeftSidebarCollapsed ? "Abrir barra lateral" : "Fechar barra lateral"}
                    >
                      {isLeftSidebarCollapsed ? (
                        <PanelLeftOpen className="w-[18px] h-[18px] text-current" strokeWidth={2.5} />
                      ) : (
                        <PanelLeftClose className="w-[18px] h-[18px] text-current" strokeWidth={2.5} />
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </header>
      )}

      {/* 2. Responsive Side-by-Side Main Layout Grid (Capped to max-7xl) - strict 5px column gap */}
      <div className={`w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-[5px] transition-all duration-300 ${isHeaderHidden ? "pt-1 md:pt-2" : "pt-12"} min-h-screen ${isSidebarHidden ? "justify-center" : ""}`}>
        {/* Left Sticky Sidebar for Desktop Viewports */}
        {!isSidebarHidden && !isLeftSidebarCollapsed && (
          <aside className={`hidden md:flex w-64 shrink-0 flex-col gap-[5px] self-start sticky ${isHeaderHidden ? "top-1 h-[calc(100vh-10px)]" : "top-12 h-[calc(100vh-48px)]"} overflow-y-auto no-scrollbar p-[5px]`}>
          {/* Sidebar Navigation Items list - strict 5px vertical separation */}
          <div className="flex flex-col gap-[5px]">
            {/* Top Items (with background) */}
            {SCREENS.filter(
              (screen) =>
                screen.id !== "signin" &&
                screen.id !== "signup" &&
                screen.id !== "recovery" &&
                screen.category !== "Configuração"
            ).map((screen) => {
              const ScreenIcon = screen.icon;
              const isActive = activeScreen === screen.id;
              const hasAlerts = screen.id === "alerts" && unreadAlertsCount > 0;
              return (
                <a
                  key={screen.id}
                  href={`#${screen.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setViewingProfileUserId(null);
                    setSettingsSubView(null);
                    setActiveScreen(screen.id);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-[10px] text-left transition-all duration-150 font-hanken text-[13px] font-bold cursor-pointer active:scale-[0.98] no-underline ${
                    isActive
                      ? "bg-zinc-850 text-white border-l-[4px] border-white pl-[12px]"
                      : "text-white bg-zinc-950/25 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-[8px] min-w-0">
                    <ScreenIcon className={`w-5 h-5 shrink-0 ${hasAlerts ? "text-rose-500 fill-rose-500/20" : "text-white"}`} strokeWidth={isActive ? 2.5 : 2.0} />
                    <span className="truncate">{screen.name}</span>
                  </div>
                  {hasAlerts && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-[6px] py-[2px] rounded-full min-w-[20px] text-center shrink-0">
                      {unreadAlertsCount}
                    </span>
                  )}
                </a>
              );
            })}

            {/* Gray Divider Line */}
            <div className="border-t border-zinc-800/60 my-[5px] mx-1" />

            {/* Bottom Items (without background - "Definições" downwards) */}
            {SCREENS.filter(
              (screen) =>
                screen.id !== "signin" &&
                screen.id !== "signup" &&
                screen.id !== "recovery" &&
                screen.category === "Configuração"
            ).map((screen) => {
              const ScreenIcon = screen.icon;
              const isActive = 
                screen.id === "suporte_ajuda" 
                  ? (activeScreen === "settings" && settingsSubView === "help")
                  : screen.id === "settings"
                    ? (activeScreen === "settings" && settingsSubView !== "help")
                    : activeScreen === screen.id;
              return (
                <a
                  key={screen.id}
                  href={`#${screen.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (screen.id === "suporte_ajuda") {
                      setSettingsSubView("help");
                      setActiveScreen("settings");
                    } else if (screen.id === "settings") {
                      setSettingsSubView(null);
                      setActiveScreen("settings");
                    } else {
                      setSettingsSubView(null);
                      setActiveScreen(screen.id);
                    }
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-[10px] text-left transition-all duration-150 font-hanken text-[13px] font-bold cursor-pointer active:scale-[0.98] no-underline ${
                    isActive
                      ? "bg-transparent text-white border-l-[4px] border-white pl-[12px]"
                      : "text-zinc-400 bg-transparent hover:text-white hover:bg-zinc-900/30"
                  }`}
                >
                  <div className="flex items-center gap-[8px] min-w-0">
                    <ScreenIcon className="w-5 h-5 shrink-0 text-current" strokeWidth={isActive ? 2.5 : 2.0} />
                    <span className="truncate">{screen.name}</span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* User Profile Footer */}
          <a
            href="#profile"
            onClick={(e) => {
              e.preventDefault();
              setViewingProfileUserId(null);
              setActiveScreen("profile");
            }}
            className="flex items-center gap-[8px] p-[10px] mt-auto rounded-[10px] hover:bg-zinc-900/50 transition-colors cursor-pointer no-underline group"
          >
            <img
              src={userProfile?.avatar || user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
              alt={userProfile?.name || user?.displayName || "Usuário"}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-800"
            />
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-hanken text-[13px] font-bold text-white truncate group-hover:text-zinc-300 transition-colors">
                {userProfile?.name || user?.displayName || "Usuário"}
              </span>
              <span className="font-hanken text-[10px] text-zinc-500 truncate">Meu perfil</span>
            </div>
          </a>
        </aside>
      )}

        {/* Center / Right Core Application Container */}
        <main className={`flex-1 w-full min-w-0 ${isHeaderHidden ? "pb-[5px]" : "pb-16"} px-[2px] flex flex-col gap-[5px]`}>
          {(activeScreen === "feed" || activeScreen === "search") && (
            <FeedScreen
              products={getOrderedProductsForFeed()}
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
              isFollowed={selectedProduct && (!!followedSellers[selectedProduct.sellerName] || (selectedProduct.seller_id && !!followedSellers[selectedProduct.seller_id]))}
              onToggleFollowSeller={toggleFollowSeller}
              isBookmarked={!!bookmarks[selectedProduct?.id]}
              onToggleBookmark={toggleBookmark}
              currentUser={user}
              onViewSellerProfile={(sellerId) => {
                setViewingProfileUserId(sellerId);
                setActiveScreen("profile");
              }}
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
              userId={user?.id}
              targetId={viewingProfileUserId || user?.id}
              followedSellers={followedSellers}
              onToggleFollow={toggleFollowSeller}
              onStartConversation={handleStartChatWithUser}
              onBack={() => {
                if (viewingProfileUserId) {
                  setViewingProfileUserId(null);
                  setActiveScreen("product_detail");
                } else {
                  setActiveScreen("feed");
                }
              }}
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
              onViewSellerProfile={(sellerId) => {
                setViewingProfileUserId(sellerId);
                setActiveScreen("profile");
              }}
              currentUser={user}
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

                // Notify followers about new product post (Requisito 6)
                if (user && formatted.id) {
                  import("./lib/notifications").then(({ notifyFollowersNewProduct }) => {
                    notifyFollowersNewProduct(user.id, formatted.name, formatted.id);
                  }).catch(err => {
                    console.error("Erro ao enviar notificações aos seguidores:", err);
                  });
                }
                
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
              onNavigate={(screenName) => {
                setActiveScreen(screenName);
                setSettingsSubView(null);
              }}
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

        {/* Right Sticky Sidebar for Desktop Viewports */}
        {!isSidebarHidden && (
          <aside className={`hidden lg:flex w-64 md:w-72 shrink-0 flex-col gap-[8px] self-start sticky ${isHeaderHidden ? "top-1 h-[calc(100vh-10px)]" : "top-12 h-[calc(100vh-48px)]"} overflow-y-auto no-scrollbar p-[5px]`}>
            <div className="bg-zinc-950 p-[12px] rounded-[10px] flex flex-col gap-[5px] border border-zinc-800/10 shadow-lg">
              <h3 className="font-hanken text-[12px] font-bold tracking-wider text-zinc-400 capitalize">
                {(() => {
                  const hasFollowed = allProfiles.some(p => (!user || p.id !== user.id) && (followedSellers[p.id] === true || followedSellers[p.name] === true));
                  return hasFollowed ? "Vendedores Seguidos" : "Sugestões De Seguido";
                })()}
              </h3>
              
              <div className="flex flex-col gap-[5px]">
                {(() => {
                  const followedList = allProfiles.filter(p => (!user || p.id !== user.id) && (followedSellers[p.id] === true || followedSellers[p.name] === true));
                  const displayList = followedList.length > 0 
                    ? followedList 
                    : allProfiles.filter(p => !user || p.id !== user.id).slice(0, 5);

                  if (displayList.length === 0) {
                    return (
                      <span className="font-hanken text-[11px] text-zinc-500 py-1 capitalize">Nenhum perfil disponível</span>
                    );
                  }

                  return displayList.slice(0, 5).map((profile) => {
                    const isFollowing = followedSellers[profile.id] === true || followedSellers[profile.name] === true;
                    return (
                      <div 
                        key={profile.id}
                        className="flex items-center justify-between gap-[5px] p-[6px] hover:bg-zinc-900 rounded-[8px] transition-colors"
                      >
                        <div 
                          onClick={() => {
                            setViewingProfileUserId(profile.id);
                            setActiveScreen("profile");
                          }}
                          className="flex items-center gap-[5px] min-w-0 cursor-pointer flex-1"
                        >
                          <img
                            src={profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                            alt={profile.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-850"
                          />
                          <div className="flex flex-col min-w-0 leading-tight">
                            <span className="font-hanken text-[12px] font-semibold text-white truncate hover:underline capitalize">
                              {profile.name}
                            </span>
                            <span className="font-hanken text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">
                              {isFollowing ? "Seguindo" : "Sugerido"}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleFollowSeller(profile.id || profile.name)}
                          className={`text-[9px] font-bold px-[10px] py-[4px] rounded-[6px] transition-all active:scale-95 border cursor-pointer ${
                            isFollowing 
                              ? "bg-zinc-900 hover:bg-rose-950/20 hover:text-rose-400 text-zinc-400 border-zinc-800 hover:border-rose-900/40"
                              : "bg-white text-zinc-950 hover:bg-zinc-200 border-transparent"
                          }`}
                        >
                          {isFollowing ? "Seguindo" : "Seguir"}
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {selectedProduct && (
              <div className="bg-zinc-950 p-[12px] rounded-[10px] flex flex-col gap-[8px] border border-zinc-800/10 shadow-lg">
                <div className="flex flex-col gap-[4px]">
                  <h1 className="font-chivo text-[15px] font-black text-white capitalize leading-tight">
                    {selectedProduct.name}
                  </h1>
                  <span className="font-chivo text-[15px] font-black text-emerald-400">
                    {selectedProduct.price}
                  </span>
                </div>
                
                <div className="flex flex-col gap-[4px] bg-zinc-900/50 p-[8px] rounded-[8px]">
                  <h3 className="font-chivo text-[13px] font-black text-neutral-200 capitalize">
                    Descrição
                  </h3>
                  <p className="font-hanken text-[12px] text-neutral-300 leading-relaxed capitalize">
                    {selectedProduct.desc || "Item de alta performance sem descrição detalhada informada."}
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 3. Mobile Navigation Bar (Fixed bottom, 64px height, hidden on desktop screens) */}
      {!isHeaderHidden && (
        <nav className="fixed bottom-0 w-full h-16 bg-zinc-900 flex md:hidden items-center justify-around px-2 z-40 max-w-md left-1/2 -translate-x-1/2 border-t border-zinc-800">
          <a
            href="#feed"
            className="flex flex-col items-center gap-1 py-1 transition-all text-white hover:opacity-90 animate-none cursor-pointer no-underline"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen("feed");
            }}
          >
            <Home className={`w-6 h-6 text-white ${activeScreen === "feed" ? "scale-105" : "opacity-80"}`} strokeWidth={2.5} />
            <span className={`text-[9px] font-medium font-hanken tracking-wider leading-none text-white ${activeScreen === "feed" ? "opacity-100" : "opacity-80"}`}>
              Início
            </span>
          </a>
 
          <a
            href="#alerts"
            className="flex flex-col items-center gap-1 py-1 transition-all text-white hover:opacity-90 animate-none cursor-pointer relative no-underline"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen("alerts");
            }}
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
          </a>
 
          {/* Centralized Upload/Subir Button with wider black background, grey/white styling (no pink), perfectly vertically centered on the same line */}
          <a
            href="#anunciar"
            className={`flex items-center justify-center w-16 h-10 bg-black rounded-[8px] shadow-lg transition-all active:scale-95 duration-200 cursor-pointer border-t-2 border-t-white border-b-4 border-b-zinc-400 border-l border-l-white/40 border-r border-r-zinc-650/40 hover:brightness-110 no-underline ${
              activeScreen === "anunciar" ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen("anunciar");
            }}
            title="Subir"
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
          </a>
 
          <a
            href="#chat"
            className="flex flex-col items-center gap-1 py-1 transition-all text-white hover:opacity-90 animate-none cursor-pointer relative no-underline"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen("chat");
            }}
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
          </a>
 
          <a
            href="#profile"
            className="flex flex-col items-center gap-1 py-1 transition-all text-white hover:opacity-90 animate-none cursor-pointer no-underline"
            onClick={(e) => {
              e.preventDefault();
              setViewingProfileUserId(null);
              setActiveScreen("profile");
            }}
          >
            <User className={`w-6 h-6 text-white ${activeScreen === "profile" ? "scale-105" : "opacity-80"}`} strokeWidth={2.5} />
            <span className={`text-[9px] font-medium font-hanken tracking-wider leading-none text-white ${activeScreen === "profile" ? "opacity-100" : "opacity-80"}`}>
              Perfil
            </span>
          </a>
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
      <InstallPWA />
    </div>
  );
}
