import { useState, useEffect } from "react";
import { Edit3, RefreshCw, Trash2, Users, ShoppingBag, ChevronRight, ArrowLeft, Star, Heart, MessageSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { uploadImage } from "../lib/supabase";
import { formatPrice } from "../lib/formatPrice";
import UserAvatar from "./UserAvatar";

interface ProfileScreenProps {
  onSelectProduct?: (product: any) => void;
  onBack?: () => void;
  currentUser?: any;
  userId?: string;
  targetId?: string;
  followedSellers?: Record<string, boolean>;
  onToggleFollow?: (sellerName: string) => void;
  onStartConversation?: (sellerId: string | null, sellerName: string, sellerImg: string, productData?: any) => void;
  onProfileUpdate?: (updatedProfile: any) => void;
}

export default function ProfileScreen({ 
  onSelectProduct, 
  onBack, 
  currentUser,
  userId,
  targetId: propTargetId,
  followedSellers = {},
  onToggleFollow,
  onStartConversation,
  onProfileUpdate
}: ProfileScreenProps) {
  const user = currentUser;
  const targetId = propTargetId || userId || currentUser?.id;
  const isOwnProfile = !propTargetId || propTargetId === currentUser?.id;
  
  // States of Profile
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Transition active sub-view: "profile" | "anuncios" | "seguidores"
  const [activeSubView, setActiveSubView] = useState<"profile" | "anuncios" | "seguidores">("profile");

  // Edit fields
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [followedProducts, setFollowedProducts] = useState<any[]>([]);

  // Real Followers & Evaluations States
  const [realFollowers, setRealFollowers] = useState<any[]>([]);
  const [myEvaluations, setMyEvaluations] = useState<any[]>([]);

  // Load real followers based on current profile's name and ID
  useEffect(() => {
    if (!profile?.name) return;

    const fetchRealFollowers = async () => {
      try {
        // 1. Fallback / Compatibilidade clássica usando followed_sellers JSONB
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, location, followed_sellers");

        if (profilesError) throw profilesError;

        let followers: any[] = [];
        if (profilesData) {
          followers = profilesData.filter((p: any) => {
            if (profile.id && p.id === profile.id) return false;
            const followed = p.followed_sellers || {};
            return followed[profile.name] === true || (profile.id && followed[profile.id] === true);
          });
        }

        // 2. Busca oficial na tabela relacional 'follows'
        let followersFromFollows: any[] = [];
        if (profile.id) {
          const { data: followsData } = await supabase
            .from('follows')
            .select(`
              follower_id,
              profiles:follower_id (id, name, avatar_url, location)
            `)
            .eq('following_id', profile.id);

          if (followsData) {
            // Conversão de tipo segura
            const mappedProfiles = followsData
              .map((f: any) => {
                if (!f.profiles) return null;
                // Tratar se profiles for array ou objeto único
                return Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
              })
              .filter(Boolean);
            followersFromFollows = mappedProfiles;
          }
        }

        // 3. Mesclar e remover duplicados
        const mergedFollowers = [...followers];
        followersFromFollows.forEach(f => {
          if (!mergedFollowers.some(existing => existing.id === f.id)) {
            mergedFollowers.push(f);
          }
        });

        setRealFollowers(mergedFollowers);
      } catch (err) {
        console.error("Erro ao carregar seguidores reais do perfil:", err);
      }
    };

    fetchRealFollowers();

    const channel1 = supabase
      .channel(`profile_followers_${profile.name}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles'
      }, () => {
        fetchRealFollowers();
      })
      .subscribe();

    const channel2 = supabase
      .channel(`profile_follows_relational_${profile.name}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows'
      }, () => {
        fetchRealFollowers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [targetId, profile?.name, profile?.id]);

  // Load real evaluations for this user profile
  useEffect(() => {
    if (!profile?.name) return;

    const fetchMyEvaluations = async () => {
      try {
        const { data, error } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('vendedor_id', profile.name);

        if (error) throw error;
        setMyEvaluations(data || []);
      } catch (err) {
        console.error("Erro ao buscar minhas avaliações:", err);
      }
    };

    fetchMyEvaluations();

    const channel = supabase
      .channel(`profile_evals_${profile.name}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'avaliacoes', 
        filter: `vendedor_id=eq.${profile.name}`
      }, () => {
        fetchMyEvaluations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.name]);

  useEffect(() => {
    if (!targetId) return;
    
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, bio, location, phone, isonline, followed_sellers, bookmarks, onboarded, settings')
        .eq('id', targetId)
        .single();
      
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();

    const channel = supabase
      .channel(`profile_view_${targetId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${targetId}` 
      }, () => {
        fetchProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetId]);

  // Format helper following: "E todo o texto,palavra,nome,ou título deve iniciar com a letra maucula e terminar por menuscular"
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

  const displayName = formatText(profile?.name || (isOwnProfile ? (user?.user_metadata?.full_name || user?.email?.split('@')[0]) : "") || "Vendedor");
  const displayAvatar = profile?.avatar_url || (isOwnProfile ? user?.user_metadata?.avatar_url : "") || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
  const bio = formatText(profile?.bio || "Entusiasta De Comércio Local E Artigos De Qualidade.");

  // Products Listener
  useEffect(() => {
    if (!targetId) return;

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, description, image_url, images, category, subcategory, views, location, seller_id, created_at, profiles:seller_id(id, name, avatar_url, isonline)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar produtos:", error);
        return;
      }

      if (data) {
        const formatted = (data || []).map(p => {
          const sellerProfile = (p as any).profiles;
          const productAny = p as any;
          return {
            ...p,
            img: productAny.image_url || productAny.img || productAny.img_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
            timeAgo: p.created_at ? "agora" : "agora",
            desc: productAny.description || productAny.desc || "",
            sellerName: sellerProfile?.name || "Vendedor",
            seller_name: sellerProfile?.name || "Vendedor",
            sellerAvatar: sellerProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
            sellerPhone: sellerProfile?.phone || "+351 912 345 678",
            followers: "4.8k",
            price: formatPrice(p.price)
          };
        });

        const myItems = formatted.filter(p => p.seller_id === targetId);
        const followedItems = formatted.filter(p => profile?.followed_sellers && profile.followed_sellers[p.seller_name] === true);
        
        setMyProducts(myItems);
        setFollowedProducts(followedItems);
      }
    };

    fetchProducts();

    const channel = supabase
      .channel('profile_view_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetId, profile]);

  const handleStartEditing = () => {
    setEditName(displayName);
    setEditBio(profile?.bio || "Entusiasta De Comércio Local E Artigos De Qualidade.");
    setEditAvatar(displayAvatar);
    setEditLocation(profile?.location || "Portugal");
    setEditPhone(profile?.phone || "");
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      let finalAvatar = editAvatar;

      if (editAvatar && editAvatar.startsWith("data:image")) {
        try {
          finalAvatar = await uploadImage(editAvatar, 'images', `profiles/${user.id}`);
        } catch (uploadErr: any) {
          console.error("Erro ao fazer upload da imagem:", uploadErr);
          if (uploadErr.message?.includes("bucket")) {
            alert(uploadErr.message);
            return;
          }
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName.trim(),
          bio: editBio.trim(),
          avatar_url: finalAvatar,
          location: editLocation.trim(),
          phone: editPhone.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      if (onProfileUpdate) {
        onProfileUpdate({
          id: user.id,
          name: editName.trim(),
          bio: editBio.trim(),
          avatar_url: finalAvatar,
          location: editLocation.trim(),
          phone: editPhone.trim(),
        });
      }
      
      setEditing(false);
    } catch (e) {
      console.error("Erro Ao Salvar Perfil:", e);
    }
  };

  const handleDeleteProduct = async (product_id: string) => {
    if (window.confirm("Desejas Apagar Este Anúncio?")) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product_id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Erro Ao Apagar Anúncio:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white font-hanken">
        <RefreshCw className="w-6 h-6 animate-spin text-white" />
      </div>
    );
  }

  const activeFollowers = realFollowers;

  // VIEW 1: Main Profile
  if (activeSubView === "profile") {
    return (
      <div className="flex flex-col gap-[5px] p-[5px] pb-24 w-full animate-fade-in bg-zinc-900 min-h-screen">
        {/* Profile Header with Back Button */}
        <div className="flex items-center gap-[5px] py-1 px-1 border-0 bg-transparent text-white justify-between">
          <div className="flex items-center gap-[5px]">
            <button
              onClick={onBack}
              className="flex items-center justify-center text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer bg-transparent border-none p-1"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
            <span className="font-hanken font-bold text-[16px] text-white">
              {isOwnProfile ? "Meu Perfil" : `Perfil De ${displayName}`}
            </span>
          </div>

          {isOwnProfile && (
            <button
              onClick={handleStartEditing}
              className="text-[12px] font-bold font-hanken bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-[8px] active:scale-95 transition-all cursor-pointer border border-zinc-700/30"
            >
              Editar Perfil
            </button>
          )}
        </div>

        {/* Profile Info & Edit Panel */}
        {editing ? (
          <div className="flex flex-col gap-[8px] p-3 bg-zinc-950/40 rounded-[8px] border border-zinc-800/20 text-white animate-fade-in">
            <h2 className="font-hanken font-bold text-[14px]">
              Editar Perfil
            </h2>
            <div className="flex flex-col gap-[4px] mt-1">
              <label className="text-[10px] text-zinc-400 font-bold">
                Nome Profissional
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-zinc-800 text-white text-[13px] font-hanken p-2 rounded-[8px] border border-zinc-750 focus:outline-none focus:ring-1 focus:ring-white"
                placeholder="Introduza O Seu Nome"
              />
            </div>
            
            <div className="flex flex-col gap-[4px]">
              <label className="text-[10px] text-zinc-400 font-bold">
                Biografia Do Perfil
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-zinc-800 text-white text-[13px] font-hanken p-2 rounded-[8px] border border-zinc-750 focus:outline-none focus:ring-1 focus:ring-white"
                rows={3}
                placeholder="Fale Um Pouco Sobre Si"
              />
            </div>

            <div className="flex flex-col gap-[4px]">
              <label className="text-[10px] text-zinc-400 font-bold">
                Foto De Perfil
              </label>
              <div className="flex items-center gap-2">
                {editAvatar && (
                  <img src={editAvatar} alt="Preview" className="w-8 h-8 rounded-full object-cover" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          const img = new Image();
                          img.src = reader.result;
                          img.onload = () => {
                            const canvas = document.createElement("canvas");
                            const MAX_WIDTH = 500;
                            const MAX_HEIGHT = 500;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              setEditAvatar(canvas.toDataURL("image/jpeg", 0.6));
                            } else {
                              setEditAvatar(reader.result as string);
                            }
                          };
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="flex-1 bg-zinc-800 text-white text-[13px] font-hanken p-1 rounded-[8px] border border-zinc-750 focus:outline-none focus:ring-1 focus:ring-white file:mr-4 file:py-1 file:px-4 file:rounded-[8px] file:border-0 file:text-[13px] file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[4px]">
              <label className="text-[10px] text-zinc-400 font-bold">
                Localidade
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full bg-zinc-800 text-white text-[13px] font-hanken p-2 rounded-[8px] border border-zinc-750 focus:outline-none focus:ring-1 focus:ring-white"
                placeholder="Exemplo: Lisboa"
              />
            </div>

            <div className="flex flex-col gap-[4px]">
              <label className="text-[10px] text-zinc-400 font-bold">
                Contacto
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-zinc-800 text-white text-[13px] font-hanken p-2 rounded-[8px] border border-zinc-750 focus:outline-none focus:ring-1 focus:ring-white"
                placeholder="Exemplo: +351 912 345 678"
              />
            </div>

            <div className="flex items-center gap-[8px] mt-2">
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-white text-black font-hanken text-[12px] font-extrabold py-2.5 rounded-[8px] hover:bg-neutral-200 transition-all active:scale-[0.98] cursor-pointer"
              >
                Salvar
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-zinc-800 text-white font-hanken text-[12px] font-extrabold py-2.5 rounded-[8px] hover:bg-zinc-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <section className="p-2 flex flex-col gap-[8px] bg-transparent text-white w-full">
            <div className="flex items-start justify-between gap-[8px]">
              <div className="relative">
                <UserAvatar src={displayAvatar} name={displayName} size="w-20 h-20 md:w-28 md:h-28" />
                <div className="absolute -bottom-1 -right-1 bg-white p-[3px] rounded-full">
                  <span className="text-[10px] text-black font-bold">✓</span>
                </div>
              </div>

              <div className="flex flex-col leading-tight flex-1">
                <h1 className="font-chivo text-[18px] md:text-[24px] font-black text-white leading-tight">
                  {displayName}
                </h1>
                <p className="font-hanken text-[11px] text-zinc-400 font-extrabold tracking-widest mt-0.5">
                  Vendedor Registado
                </p>
                <div className="flex items-center gap-[4px] mt-1 text-zinc-400">
                  <Star className="w-3.5 h-3.5 text-zinc-500 fill-zinc-500 shrink-0" />
                  <span className="font-hanken text-[11px] font-bold">
                    {myEvaluations.length > 0
                      ? `${(myEvaluations.reduce((sum, item) => sum + (item.estrelas || 0), 0) / myEvaluations.length).toFixed(1)} (${myEvaluations.length} ${myEvaluations.length === 1 ? formatText("Avaliação") : formatText("Avaliações")})`
                      : formatText("Sem Avaliações")
                    }
                  </span>
                </div>
                <div className="border-l-[3.5px] border-zinc-500 pl-2 mt-2">
                  <p className="font-hanken text-[12px] text-white/95 leading-relaxed">
                    {bio}
                  </p>
                </div>
              </div>
            </div>

            {/* Local Stats Grid */}
            <div className="grid grid-cols-3 gap-[8px] pt-1">
              <div className="p-2 text-center bg-zinc-950/40 rounded-[8px] border border-zinc-800/20">
                <span className="font-hanken text-[9px] text-zinc-400 font-extrabold tracking-widest block mb-0.5">
                  Publicações
                </span>
                <span className="font-chivo text-[18px] font-black text-white leading-none">
                  {myProducts.length}
                </span>
              </div>
              <div className="p-2 text-center bg-zinc-950/40 rounded-[8px] border border-zinc-800/20">
                <span className="font-hanken text-[9px] text-zinc-400 font-extrabold tracking-widest block mb-0.5">
                  Seguidores
                </span>
                <span className="font-chivo text-[18px] font-black text-white leading-none">
                  {realFollowers.length}
                </span>
              </div>
              {isOwnProfile ? (
                <div className="p-2 text-center bg-zinc-950/40 rounded-[8px] border border-zinc-800/20">
                  <span className="font-hanken text-[9px] text-zinc-400 font-extrabold tracking-widest block mb-0.5">
                    A Seguir
                  </span>
                  <span className="font-chivo text-[18px] font-black text-white leading-none">
                    {Object.values(profile?.followed_sellers || {}).filter(Boolean).length}
                  </span>
                </div>
              ) : (
                <div className="p-2 text-center bg-zinc-950/40 rounded-[8px] border border-zinc-800/20">
                  <span className="font-hanken text-[9px] text-zinc-400 font-extrabold tracking-widest block mb-0.5">
                    Avaliação
                  </span>
                  <span className="font-chivo text-[18px] font-black text-white leading-none">
                    {myEvaluations.length > 0
                      ? (myEvaluations.reduce((sum, item) => sum + (item.estrelas || 0), 0) / myEvaluations.length).toFixed(1)
                      : "—"
                    }
                  </span>
                </div>
              )}
            </div>

            {/* If public view, show follow and send message buttons */}
            {!isOwnProfile && (
              <div className="flex items-center gap-[8px] mt-2">
                {(() => {
                  const isFollowing = profile && (followedSellers[profile.name] === true || followedSellers[profile.id] === true);
                  return (
                    <button
                      type="button"
                      onClick={() => onToggleFollow?.(profile?.id || profile?.name || "")}
                      className="flex-1 flex items-center justify-center gap-[6px] bg-white text-zinc-950 font-hanken text-[12px] font-extrabold py-2.5 rounded-[8px] hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer border-none outline-none"
                    >
                      <Heart className={`w-4 h-4 ${isFollowing ? "text-rose-500 fill-rose-500" : "text-zinc-950"}`} strokeWidth={2.5} />
                      <span>{isFollowing ? "Seguindo" : "Seguir"}</span>
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    if (profile) {
                      onStartConversation?.(profile.id, profile.name, profile.avatar_url, null);
                    }
                  }}
                  className="flex-1 bg-zinc-800 text-white font-hanken text-[12px] font-extrabold py-2.5 rounded-[8px] hover:bg-zinc-700 transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-[6px]"
                >
                  <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
                  <span>Mensagem</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Following Products horizontal loop - transparent background and no borders */}
        {isOwnProfile && (
          <div className="flex flex-col gap-[6px] mt-1 px-2">
            <h3 className="font-hanken text-[12px] text-zinc-400 font-extrabold tracking-wider">
              Seguindo
            </h3>
            {followedProducts.length === 0 ? (
              <div className="h-[150px] flex flex-col items-center justify-center bg-transparent rounded-[8px] text-center p-4">
                <span className="text-[12px] text-zinc-500 font-hanken">Nenhuma Publicação De Quem Segues</span>
              </div>
            ) : (
              <div className="flex gap-[8px] overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory bg-transparent">
                {followedProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct?.(p)}
                    className="flex-none w-[155px] flex flex-col gap-[6px] snap-start bg-transparent"
                  >
                    <div className="relative w-full h-[150px] rounded-[8px] overflow-hidden bg-transparent cursor-pointer">
                      <img
                        className="w-full h-full object-cover"
                        src={p.img}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/45 to-transparent p-2 flex flex-col justify-end leading-tight">
                        <span className="font-hanken font-bold text-[11px] text-white truncate w-full opacity-90">
                          {formatText(p.name)}
                        </span>
                        <span className="font-chivo font-black text-zinc-300 text-[12px] mt-0.5">
                          {p.price}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct?.(p);
                      }}
                      className="w-full py-1.5 bg-transparent hover:opacity-85 text-white rounded-[8px] flex items-center justify-center transition-all cursor-pointer border-none"
                    >
                      <ChevronRight className="w-4.5 h-4.5 text-white stroke-[2.5]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clickable bottom options - Completely transparent backgrounds and no borders/lines */}
        <div className="flex flex-col gap-[4px] mt-2 px-2 bg-transparent">
          <button
            onClick={() => setActiveSubView("anuncios")}
            className="flex items-center justify-between py-3 px-2 border-none bg-transparent hover:opacity-85 rounded-[8px] text-white transition-all cursor-pointer w-full"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5.5 h-5.5 text-white stroke-[2]" />
              <span className="font-hanken font-bold text-[15px] tracking-wider text-white">
                {isOwnProfile ? "Meus Anúncios" : "Anúncios Do Vendedor"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-chivo font-bold text-white text-[13px] bg-zinc-800 px-2 py-0.5 rounded-[8px]">
                {myProducts.length}
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </button>

          <button
            onClick={() => setActiveSubView("seguidores")}
            className="flex items-center justify-between py-3 px-2 border-none bg-transparent hover:opacity-85 rounded-[8px] text-white transition-all cursor-pointer w-full"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5.5 h-5.5 text-white stroke-[2]" />
              <span className="font-hanken font-bold text-[15px] tracking-wider text-white">
                {isOwnProfile ? "Meus Seguidores" : "Seguidores"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-chivo font-bold text-white text-[13px] bg-zinc-850 px-2 py-0.5 rounded-[8px]">
                {realFollowers.length}
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // VIEW 2: Meus Anúncios Sub-View
  if (activeSubView === "anuncios") {
    return (
      <div className="flex flex-col gap-[5px] p-[5px] pb-24 w-full animate-fade-in bg-zinc-900 min-h-screen text-white">
        {/* Header bar */}
        <div className="flex items-center gap-[5px] py-1 px-1 border-0 bg-transparent text-white justify-between">
          <div className="flex items-center gap-[5px]">
            <button
              onClick={() => setActiveSubView("profile")}
              className="flex items-center justify-center text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer bg-transparent border-none p-1"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
            <span className="font-hanken font-bold text-[16px] text-white">
              {isOwnProfile ? "Meus Anúncios" : "Anúncios Do Vendedor"}
            </span>
          </div>
          <span className="font-chivo font-bold text-sm bg-zinc-800 px-2.5 py-1 rounded-[8px]">
            {myProducts.length}
          </span>
        </div>

        {/* Products lists of current user - No backgrounds and no borders/lines */}
        {myProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-transparent rounded-[8px] text-center gap-2 mt-2">
            <p className="text-zinc-500 font-hanken text-[13px]">
              {isOwnProfile ? "Nenhuma Publicação Ativa" : "Nenhuma Publicação Ativa Deste Vendedor"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[5px] w-full px-1 mt-1 bg-transparent">
            {myProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct?.(p)}
                className="flex flex-col p-1 bg-transparent rounded-[8px] cursor-pointer hover:opacity-90 transition-all duration-200 gap-[6px]"
              >
                {/* Product Image */}
                <div className="w-full aspect-square rounded-[8px] overflow-hidden bg-transparent relative">
                  <img
                    className="w-full h-full object-cover rounded-[8px]"
                    src={p.img}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-[4px] font-hanken">
                    {formatText(p.location)}
                  </span>
                </div>
                
                {/* Product details */}
                <div className="flex flex-col leading-none">
                  <h3 className="font-hanken font-bold text-[13px] text-white line-clamp-1">
                    {formatText(p.name)}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-1.5">
                        <span className="font-chivo font-black text-white text-[13.5px]">
                          {p.price}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-medium">
                        {p.views || 0} {p.views === 1 ? formatText("Visualização") : formatText("Visualizações")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete direct action - No backgrounds, borderless, clean layout */}
                {isOwnProfile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(p.id);
                    }}
                    className="w-full mt-1 py-1 bg-transparent hover:text-red-400 text-zinc-400 active:scale-95 transition-all text-center text-[11px] font-bold font-hanken rounded-[8px] cursor-pointer border-none"
                  >
                    Apagar Anúncio
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VIEW 3: Meus Seguidores Sub-View
  if (activeSubView === "seguidores") {
    return (
      <div className="flex flex-col gap-[5px] p-[5px] pb-24 w-full animate-fade-in bg-zinc-900 min-h-screen text-white">
        {/* Header bar */}
        <div className="flex items-center gap-[5px] py-1 px-1 border-0 bg-transparent text-white justify-between">
          <div className="flex items-center gap-[5px]">
            <button
              onClick={() => setActiveSubView("profile")}
              className="flex items-center justify-center text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer bg-transparent border-none p-1"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
            <span className="font-hanken font-bold text-[16px] text-white">
              {isOwnProfile ? "Meus Seguidores" : "Seguidores"}
            </span>
          </div>
          <span className="font-chivo font-bold text-sm bg-zinc-800 px-2.5 py-1 rounded-[8px]">
            {activeFollowers.length}
          </span>
        </div>

        {/* List of followers - Transparent options and no border lines */}
        {activeFollowers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-transparent rounded-[8px] text-center gap-2 mt-2">
            <p className="text-zinc-500 font-hanken text-[13px]">
              {isOwnProfile ? "Ainda Não Tens Nenhum Seguidor" : "Este Vendedor Ainda Não Tem Seguidores"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[5px] px-1 mt-1 bg-transparent">
            {activeFollowers.map((follower, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-transparent rounded-[8px] border-none"
              >
                <div className="flex items-center gap-3 bg-transparent">
                  <UserAvatar src={follower.avatar_url} name={follower.name} size="w-10 h-10" />
                  <div className="flex flex-col">
                    <span className="font-hanken font-bold text-[13px] text-white">
                      {formatText(follower.name || "Utilizador")}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {formatText(follower.location || "Portugal")}
                    </span>
                  </div>
                </div>
                
                <button 
                  className="text-[11px] font-bold font-hanken bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-[8px] active:scale-95 transition-all cursor-pointer border border-zinc-700/30"
                  onClick={() => {
                    if (follower) {
                      onStartConversation?.(follower.id, follower.name, follower.avatar_url, null);
                    }
                  }}
                >
                  Mensagem
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
