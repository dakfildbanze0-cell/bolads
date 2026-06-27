import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  MessageSquare,
  ThumbsDown,
  Eye, 
  Share2, 
  Check, 
  Heart, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ThumbsUp,
  Download,
  PlusSquare,
  AlertOctagon,
  Users,
  Star,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductDetailScreenProps {
  product: any;
  onBack: () => void;
  onToggleFollowSeller?: (sellerName: string) => void;
  isFollowed?: boolean;
  onToggleBookmark?: (productId: string) => void;
  isBookmarked?: boolean;
  onSendMessage?: (messageText: string) => void;
  allProducts?: any[];
  onSelectProduct?: (product: any) => void;
  currentUser?: any;
}

interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timeAgo: string;
  replies?: Comment[];
}

const INITIAL_COMMENTS: Record<number, Comment[]> = {
  1: [
    {
      id: "c1",
      authorName: "Carlos Santos",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      text: "Produto excelente, vale muito a pena pelo preço anunciado.",
      timeAgo: "Há 1 hora",
      replies: [
        {
          id: "r1",
          authorName: "Suporte Técnico",
          authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
          text: "Muito obrigado pelo feedback, Carlos! Estamos aqui se precisar.",
          timeAgo: "Há 45 min",
        }
      ]
    },
  ],
  2: [
    {
      id: "c2",
      authorName: "Ana Silva",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      text: "Eu comprei um modelo desse e estou gostando demais.",
      timeAgo: "Há 2 horas",
      replies: [
        {
          id: "r2",
          authorName: "Equipe de Vendas",
          authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
          text: "Ficamos muito contentes com o seu comentário, Ana!",
          timeAgo: "Há 1 hora",
        }
      ]
    },
  ],
};

const formatText = (str: string) => {
  if (!str) return "";
  return str.split(/(\s+)/).map(word => {
    if (!word.trim()) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join("");
};

export default function ProductDetailScreen({
  product,
  onBack,
  onToggleFollowSeller,
  isFollowed = false,
  onToggleBookmark,
  isBookmarked: externalBookmarked = false,
  onSendMessage,
  allProducts = [],
  onSelectProduct,
  currentUser
}: ProductDetailScreenProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(externalBookmarked);
  const [isRated, setIsRated] = useState(false);
  const [autoMessage, setAutoMessage] = useState(
    product ? `Olá! 👋 Tenho interesse no "${product.name}". Ainda está disponível?` : ""
  );
  
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Removed redundant auth calls to prevent Supabase lock errors
  // currentUser is now passed as a prop from App.tsx

  // Seller Evaluations states
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentUserEvaluation, setCurrentUserEvaluation] = useState<any | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>("");
  const [ratingSuccess, setRatingSuccess] = useState<boolean>(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [realFollowersCount, setRealFollowersCount] = useState<number>(0);
  const [productViews, setProductViews] = useState<number>(product?.views || 0);

  // Track product views
  useEffect(() => {
    if (!product?.id) return;

    // Increment views locally first for immediate feedback
    setProductViews((prev) => prev + 1);

    // Call RPC to increment views in database
    const incrementViews = async () => {
      try {
        await supabase.rpc('increment_product_views', { product_id: product.id });
      } catch (err) {
        console.error("Erro ao incrementar visualizações:", err);
      }
    };
    
    incrementViews();

    // Subscribe to changes to this specific product to keep views updated
    const channel = supabase
      .channel(`product_views_${product.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'products',
        filter: `id=eq.${product.id}`
      }, (payload) => {
        if (payload.new && payload.new.views !== undefined) {
          setProductViews(payload.new.views);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product?.id]);

  // Load real followers count for this seller
  useEffect(() => {
    const sellerName = product?.seller_name || product?.sellerName;
    if (!sellerName) return;

    const fetchRealFollowers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("followed_sellers");
        
        if (error) throw error;
        
        if (data) {
          const count = data.filter((p: any) => {
            const followed = p.followed_sellers || {};
            return followed[sellerName] === true;
          }).length;
          setRealFollowersCount(count);
        }
      } catch (err) {
        console.error("Erro ao carregar seguidores reais:", err);
      }
    };

    fetchRealFollowers();

    const channel = supabase
      .channel(`followers_${sellerName}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles'
      }, () => {
        fetchRealFollowers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product?.seller_name, product?.sellerName, isFollowed]);

  // Denúncias states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Use currentUser.id matching the seller_id to know if it's the own product
  const isOwnProduct = currentUser?.id === product?.seller_id;

  // Subscribe to evaluations for this seller
  useEffect(() => {
    if (!product?.seller_name) return;

    const fetchEvaluations = async () => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('vendedor_id', product.seller_name);

      if (error) {
        console.error("Erro ao buscar avaliações:", error);
        return;
      }

      setEvaluations(data || []);

      if (currentUser) {
        const found = data?.find((item) => item.user_id === currentUser.id);
        if (found) {
          setCurrentUserEvaluation(found);
          setRatingStars(found.estrelas || 0);
          setRatingComment(found.comentario || "");
        } else {
          setCurrentUserEvaluation(null);
          setRatingStars(0);
          setRatingComment("");
        }
      }
    };

    fetchEvaluations();

    const channel = supabase
      .channel(`evals_${product.seller_name}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'avaliacoes', 
        filter: `vendedor_id=eq.${product.seller_name}` 
      }, () => {
        fetchEvaluations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product?.seller_name, currentUser?.id]);

  const handleSendEvaluation = async () => {
    if (!currentUser) return;
    if (ratingStars < 1 || ratingStars > 5) return;

    setIsSubmittingRating(true);
    setRatingSuccess(false);

    try {
      const ratingPayload = {
        user_id: currentUser.id,
        vendedor_id: product.seller_name,
        estrelas: ratingStars,
        comentario: ratingComment.trim(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('avaliacoes')
        .upsert(ratingPayload, { onConflict: 'user_id,vendedor_id' });

      if (error) throw error;
      setRatingSuccess(true);
      
      // Notify seller
      if (product.seller_id && product.seller_id !== currentUser.id && !currentUserEvaluation) {
        const { sendNotification } = await import("../lib/notifications");
        await sendNotification({
          userId: product.seller_id,
          type: "review",
          title: "Nova avaliação",
          description: `Seu perfil recebeu uma nova avaliação de ${ratingStars} estrela(s).`,
          productName: product.name,
          productId: product.id,
          senderId: currentUser.id
        });
      }
      
      // Auto clear success layout state after 4 seconds
      setTimeout(() => {
        setRatingSuccess(false);
      }, 4000);
    } catch (error) {
      console.error("Error saving evaluation:", error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const totalRatings = evaluations.length;

  useEffect(() => {
    setBookmarked(externalBookmarked);
  }, [externalBookmarked]);

  // Auto reset of page view, image carousel, and recommended message on product changes
  useEffect(() => {
    setActiveImageIdx(0);
    setAutoMessage(product ? `Olá! 👋 Tenho interesse no "${product.name}". Ainda está disponível?` : "");
    setBookmarked(externalBookmarked);
    setCopied(false);
    setIsRated(false);
    setShowCommentsModal(false);
    setNewCommentText("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product?.id]);

  // Real-time subscription to comments for this product from Supabase
  useEffect(() => {
    if (!product?.id) return;

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comentarios')
        .select('*')
        .eq('productId', product.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Erro ao buscar comentários:", error);
        return;
      }

      if (data && data.length > 0) {
        const list = data.map(comm => ({
          id: comm.id,
          authorName: comm.authorName || "Membro",
          authorAvatar: comm.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
          text: comm.text,
          timeAgo: comm.created_at ? new Date(comm.created_at).toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' }) : "Agora mesmo",
          replies: []
        }));
        setCommentsList(list);
      } else {
        setCommentsList(INITIAL_COMMENTS[product.id] || []);
      }
    };

    fetchComments();

    const channel = supabase
      .channel(`comments_${product.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comentarios', 
        filter: `productId=eq.${product.id}` 
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product?.id]);

  if (!product) return null;

  // Gather fallback images list if none provided
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.img || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = () => {
    const shareText = `Confira o produto "${product.name}" por apenas ${product.price}! Contato: ${product.sellerPhone || "+55 (11) 98721-6543"}`;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Safe phone and WA text
  const rawPhone = product.sellerPhone || "+55 (11) 98721-6543";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone || "5511987216543"}?text=Olá%20${encodeURIComponent(product.sellerName || "Vendedor")},%20vi%20seu%20anúncio%20do%20${encodeURIComponent(product.name)}%20no%20app%20Boladas%20e%20gostaria%20de%20saber%20mais%20detalhes!`;

  return (
    <div className="flex flex-col gap-[5px] p-[5px] w-full animate-fade-in pb-[5px] text-white bg-zinc-900 min-h-screen">
      {/* 1. Header Bar with tight back action - MAX 5PX SEPARATION */}
      <div className="flex items-center justify-between p-1 bg-transparent w-full">
        <div className="flex items-center gap-[10px]">
          <button
            onClick={onBack}
            className="flex items-center justify-center text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer bg-transparent border-none p-1"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={3.5} />
          </button>
          <span className="font-chivo text-[13px] font-black text-white uppercase tracking-wider leading-none">
            Ver Produto
          </span>
        </div>

        <button
          onClick={handleShare}
          className="p-1 hover:opacity-80 active:scale-95 transition-all cursor-pointer bg-transparent border-none text-white flex items-center justify-center"
          title="Compartilhar"
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-400 animate-pulse" strokeWidth={3.5} />
          ) : (
            <Share2 className="w-5 h-5 text-white" strokeWidth={3.5} />
          )}
        </button>
      </div>

      {/* 2. Interactive Image Gallery with Dot Indicator Container - MAX 5PX SEPARATION */}
      <div className="relative w-full aspect-square md:aspect-video rounded-[10px] overflow-hidden bg-transparent flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImageIdx}
            src={images[activeImageIdx]}
            alt={`${product.name} - Imagem ${activeImageIdx + 1}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Carousel overlay indicator badge */}
        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-[3px] rounded-[4px] text-[10px] font-chivo font-black tracking-widest text-white">
          {activeImageIdx + 1} / {images.length} FOTOS
        </div>

        {/* Promo badge indicator */}
        {product.badge && (
          <div className="absolute top-2 right-2 bg-white text-black px-2 py-[3px] rounded-[4px] text-[9px] font-chivo font-black uppercase tracking-wider">
            {product.badge}
          </div>
        )}

        {/* Gallery navigational arrows only if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform border-none"
              title="Anterior"
            >
              <ChevronLeft className="w-6 h-6 text-white" strokeWidth={3.5} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform border-none"
              title="Próxima"
            >
              <ChevronRight className="w-6 h-6 text-white" strokeWidth={3.5} />
            </button>
          </>
        )}

        {/* Floating carousel dot navigation tracker row */}
        {images.length > 1 && (
          <div className="absolute bottom-3 flex gap-[5px]">
            {images.map((_, i) => (
              <span
                key={i}
                onClick={() => setActiveImageIdx(i)}
                className={`w-2.5 h-1.5 rounded-full cursor-pointer transition-all ${
                  activeImageIdx === i ? "bg-white w-5" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Social & Stats Action Bar - Transparent, scrollable, without likes and save */}
      <div className="bg-transparent text-white py-[10px] px-[4px] flex items-center gap-[16px] w-full border-y border-zinc-800 overflow-x-auto no-scrollbar select-none">
        {/* Views group */}
        <div className="flex flex-col items-center min-w-[45px] shrink-0">
          <Eye className="w-5 h-5 text-zinc-400" strokeWidth={2.5} />
          <span className="font-hanken text-[15px] font-black tracking-tight leading-none mt-1">{productViews}</span>
        </div>

        {/* separator */}
        <div className="h-[25px] w-[1px] bg-zinc-800 shrink-0" />

        {/* Action group */}
        <div className="flex items-center gap-[16px] shrink-0">
          {/* Favoritar */}
          <button 
            type="button"
            onClick={() => {
              setBookmarked(!bookmarked);
              onToggleBookmark?.(product.id);
            }} 
            className="flex flex-col items-center gap-[1px] cursor-pointer hover:opacity-80 shrink-0 bg-transparent border-none outline-none"
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? "text-white fill-white" : "text-zinc-400"}`} strokeWidth={2.5} />
            <span className="font-hanken text-[11px] font-black mt-1 text-zinc-300">Favoritar</span>
            <div className="w-full h-[2px] bg-zinc-700/80 mt-[2px]" />
          </button>

          {/* Comentários */}
          <button 
            type="button"
            onClick={() => setShowCommentsModal(true)}
            className="flex flex-col items-center gap-[1px] relative cursor-pointer hover:opacity-80 shrink-0 bg-transparent border-none outline-none"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-zinc-400" strokeWidth={2.5} />
              <span className="absolute -top-[6px] -right-[8px] bg-rose-500 text-white text-[9px] font-black px-[4px] py-[1px] rounded-full border border-black">19</span>
            </div>
            <span className="font-hanken text-[11px] font-black mt-1 text-zinc-300">Comentários</span>
            <div className="w-full h-[2px] bg-zinc-700/80 mt-[2px]" />
          </button>

          {/* Avaliar */}
          {!isOwnProduct && (
            <button 
              type="button"
              onClick={() => setIsRated(!isRated)} 
              className="flex flex-col items-center gap-[1px] cursor-pointer hover:opacity-80 shrink-0 bg-transparent border-none outline-none"
            >
              <Star className={`w-5 h-5 ${isRated ? "text-white fill-white" : "text-zinc-400"}`} strokeWidth={2.5} />
              <span className="font-hanken text-[11px] font-black mt-1 text-zinc-300">Avaliar</span>
              <div className="w-full h-[2px] bg-zinc-700/80 mt-[2px]" />
            </button>
          )}

          {/* Compartilhar */}
          <button 
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-[1px] cursor-pointer hover:opacity-80 shrink-0 bg-transparent border-none outline-none"
          >
            <Share2 className="w-5 h-5 text-zinc-400" strokeWidth={2.5} />
            <span className="font-hanken text-[11px] font-black mt-1 text-zinc-300">Compartilhar</span>
            <div className="w-full h-[2px] bg-zinc-700/80 mt-[2px]" />
          </button>

          {/* Denunciar */}
          {!isOwnProduct && (
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  alert(formatText("Por favor faça login para denunciar"));
                  return;
                }
                setShowReportModal(true);
                setReportSuccess(false);
                setReportReason("");
                setReportDetails("");
              }}
              className="flex flex-col items-center gap-[1px] cursor-pointer hover:opacity-80 shrink-0 bg-transparent border-none outline-none"
            >
              <AlertOctagon className="w-5 h-5 text-zinc-400" strokeWidth={2.5} />
              <span className="font-hanken text-[11px] font-black mt-1 text-zinc-300">{formatText("Denunciar")}</span>
              <div className="w-full h-[2px] bg-zinc-700/80 mt-[2px]" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Star Rating Panel */}
      <AnimatePresence>
        {isRated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-[8px] p-3 flex flex-col gap-2 overflow-hidden mt-1"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-hanken text-[13px] font-black text-white tracking-wider">
                {currentUserEvaluation ? formatText("Editar Avaliação") : formatText("Avaliar Vendedor")}
              </span>
              <span className="text-[10px] font-bold text-zinc-500 tracking-widest">
                {product.sellerName}
              </span>
            </div>

            {/* If not logged in, explain */}
            {!currentUser ? (
              <div className="text-[12px] font-medium text-zinc-400 py-2">
                {formatText("Por Favor Faça Login Para Avaliar Este Vendedor")}
              </div>
            ) : (
              <>
                {currentUserEvaluation && (
                  <div className="text-[11px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-850 p-2 rounded-[8px]">
                    {formatText("Você Já Avaliou Este Vendedor Com")} {currentUserEvaluation.estrelas} {currentUserEvaluation.estrelas === 1 ? formatText("Estrela") : formatText("Estrelas")}. {formatText("Você Pode Editar Sua Avaliação Abaixo.")}
                  </div>
                )}

                {/* 1 to 5 Stars Input */}
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1 hover:scale-110 active:scale-95 transition-all bg-transparent border-none outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= ratingStars ? "text-white fill-white" : "text-zinc-700"
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-zinc-300 ml-1">
                    {ratingStars > 0 ? `${ratingStars} ${ratingStars === 1 ? formatText("Estrela") : formatText("Estrelas")}` : formatText("Sem Seleção")}
                  </span>
                </div>

                {/* Optional Comment Input */}
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 text-white font-hanken text-[13px] p-2.5 rounded-[8px] border border-zinc-800 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed placeholder:text-zinc-650"
                  placeholder={formatText("Escreva Um Comentário Opcional...")}
                />

                {/* Submit button appears when ratingStars is selected (ratingStars > 0) */}
                {ratingStars > 0 && (
                  <button
                    type="button"
                    onClick={handleSendEvaluation}
                    disabled={isSubmittingRating}
                    className="w-full bg-white text-zinc-950 font-hanken text-[12px] font-black tracking-wider py-2 px-3 rounded-[8px] hover:bg-zinc-200 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none"
                  >
                    {isSubmittingRating ? formatText("Enviando...") : formatText("Enviar Avaliação")}
                  </button>
                )}

                {/* Success Message */}
                {ratingSuccess && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-[8px] flex items-center gap-2 mt-1"
                  >
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span className="font-hanken text-[12px] text-zinc-300 font-extrabold">
                      {formatText("Sua Avaliação Foi Enviada Com Sucesso!")}
                    </span>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Product Info Panel with Title, Pricing, Stats - MAX 5PX SEPARATION */}
      <section className="bg-transparent p-0 flex flex-col gap-[8px] w-full border-none shadow-none">
        
        {/* Seller Info Block: Avatar aligned strictly with the Name and Stats below the Name. Price is aligned with the name to the right */}
        <div className="flex justify-between items-center w-full gap-[8px]">
          <div className="flex items-center gap-[8px] min-w-0 flex-1">
            <img
              src={product.sellerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
              alt={product.sellerName || "Vendedor"}
              className="w-10 h-10 object-cover rounded-full shrink-0 border border-zinc-800"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-hanken text-[16px] md:text-[18px] font-black text-white">
                {formatText(product.sellerName || "Vendedor")}
              </span>
              
              {/* Location, Followers, and Stars below the seller name */}
              <div className="flex items-center flex-wrap gap-[6px] text-zinc-400 text-[10px] font-bold mt-[2px] leading-none">
                <span className="flex items-center gap-[3px]">
                  <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span>{formatText(product.location || "Lisboa")}</span>
                </span>
                <span className="text-zinc-650">•</span>
                <span className="flex items-center gap-[3px]">
                  <Users className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span>{realFollowersCount} {realFollowersCount === 1 ? formatText("Seguidor") : formatText("Seguidores")}</span>
                </span>
                <span className="text-zinc-650">•</span>
                <span className="flex items-center gap-[3px]">
                  <Star className="w-3 h-3 text-zinc-500 fill-zinc-500 shrink-0" />
                  <span>
                    {totalRatings > 0 
                      ? `${(evaluations.reduce((sum, item) => sum + (item.estrelas || 0), 0) / totalRatings).toFixed(1)} (${totalRatings} ${totalRatings === 1 ? formatText("Avaliação") : formatText("Avaliações")})`
                      : formatText("Sem Avaliações")
                    }
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Separated Product Title & Local Pickup below (not aligned with avatar) */}
        <div className="flex flex-col min-w-0 leading-tight mt-[4px]">
          <h1 className="font-chivo text-[18px] md:text-[22px] font-black text-white uppercase tracking-tight">
            {formatText(product.name)}
          </h1>
          <div className="flex flex-col gap-[4px] mt-[4px]">
            <div className="flex items-center justify-between w-full">
              <span className="font-chivo text-[18px] md:text-[22px] font-black text-white shrink-0">
                {product.price}
              </span>
              {!isOwnProduct && (
                <button
                  type="button"
                  onClick={() => onToggleFollowSeller?.(product.sellerName)}
                  className="flex items-center justify-center gap-[6px] bg-white text-black font-extrabold text-[14px] uppercase tracking-wider px-[20px] py-[8px] rounded-[8px] active:scale-95 transition-all border-none shrink-0 cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isFollowed ? "text-rose-500 fill-rose-500" : "text-black"}`} strokeWidth={2.5} />
                  <span>{isFollowed ? "Seguido" : "Seguir"}</span>
                </button>
              )}
            </div>
            {product.localPickup && (
              <span className="bg-zinc-900 text-white text-[9px] md:text-[10px] font-extrabold uppercase px-1.5 py-0.5 tracking-wider inline-block rounded self-start">
                Retirada Local Ativa
              </span>
            )}
          </div>
        </div>

        {/* Description section with max 8px components separation and custom font sizes */}
        <div className="flex flex-col gap-[8px] mt-[4px]">
          <div className="flex flex-col gap-[4px] bg-zinc-900/50 p-[8px] rounded-[8px]">
            <h3 className="font-chivo text-[17px] font-black text-neutral-200">
              {formatText("Descrição")}
            </h3>
            <p className="font-hanken text-[16px] text-neutral-300 leading-relaxed">
              {product.desc || "Item de alta performance sem descrição detalhada informada."}
            </p>
          </div>

          <div className="flex flex-col gap-[4px] bg-zinc-900/50 p-[8px] rounded-[8px]">
            <h3 className="font-chivo text-[17px] font-black text-neutral-200">
              {formatText("Celular")}
            </h3>
            <span className="font-chivo text-[18px] font-black text-white tracking-tight">
              {rawPhone}
            </span>
          </div>
        </div>

        {/* Modal/Overlay showing full list of comments and keyboard input */}
        {showCommentsModal && (
          <div className="fixed inset-0 bg-neutral-950/98 flex flex-col z-50 p-[12px] justify-between max-w-md mx-auto animate-fade-in">
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center gap-[8px] py-[4px]">
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="p-[4px] -ml-[4px] text-white hover:opacity-80 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center shrink-0 active:scale-95"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                </button>
                <div className="flex flex-col">
                  <h3 className="font-chivo text-[17px] font-black text-white leading-none">
                    Comentários
                  </h3>
                  <span className="font-hanken text-[11px] text-neutral-400 mt-[2px] leading-none">
                    Discussão do anúncio
                  </span>
                </div>
              </div>

              {/* Scrollable comments list, completely transparent background, with visual connector lines */}
              <div className="flex flex-col gap-[14px] overflow-y-auto max-h-[75vh] no-scrollbar py-[4px]">
                {commentsList.map((comm) => (
                  <div key={comm.id} className="flex flex-col gap-[8px]">
                    {/* Parent Comment */}
                    <div className="flex gap-[8px] items-start relative bg-transparent">
                      {comm.replies && comm.replies.length > 0 && (
                        <div className="absolute left-[15px] top-[32px] bottom-[-8px] w-[2px] bg-zinc-800" />
                      )}
                      <img
                        alt={comm.authorName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 z-10"
                        src={comm.authorAvatar}
                      />
                      <div className="flex flex-col flex-1 leading-tight min-w-0">
                        <div className="flex items-baseline justify-between gap-[6px]">
                          <span className="font-hanken text-[15px] font-bold text-white truncate">
                            {comm.authorName}
                          </span>
                          <span className="text-[11px] text-neutral-500 shrink-0">
                            {comm.timeAgo}
                          </span>
                        </div>
                        <p className="font-hanken text-[15px] text-neutral-300 mt-[2px] leading-snug">
                          {comm.text}
                        </p>
                      </div>
                    </div>

                    {/* Replies with visual connection lines */}
                    {comm.replies && comm.replies.map((reply, rIdx) => {
                      const isLast = comm.replies ? rIdx === comm.replies.length - 1 : false;
                      return (
                        <div key={reply.id} className="flex gap-[8px] items-start pl-[32px] relative bg-transparent">
                          {/* Left Thread Connectors */}
                          <div className={`absolute left-[15px] top-[-8px] ${isLast ? 'h-[24px]' : 'bottom-0'} w-[2px] bg-zinc-800`} />
                          <div className="absolute left-[15px] top-[16px] w-[14px] h-[2px] bg-zinc-800" />

                          <img
                            alt={reply.authorName}
                            className="w-6 h-6 rounded-full object-cover shrink-0 z-10"
                            src={reply.authorAvatar}
                          />
                          <div className="flex flex-col flex-1 leading-tight min-w-0">
                            <div className="flex items-baseline justify-between gap-[6px]">
                              <span className="font-hanken text-[13px] font-bold text-neutral-350 truncate">
                                {reply.authorName}
                              </span>
                              <span className="text-[10px] text-neutral-500 shrink-0">
                                {reply.timeAgo}
                              </span>
                            </div>
                            <p className="font-hanken text-[13px] text-neutral-300 mt-[1px] leading-snug">
                              {reply.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

             {/* Input form at the bottom, matching rules */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCommentText.trim()) return;
                
                try {
                  const authorName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "Membro";
                  const authorAvatar = currentUser?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
                  
                  const { error } = await supabase.from('comentarios').insert({
                    productId: product.id,
                    authorId: currentUser?.id || "anonimo",
                    authorName,
                    authorAvatar,
                    text: newCommentText.trim()
                  });

                  if (error) throw error;

                  // Send notification
                  if (product.seller_id && currentUser && product.seller_id !== currentUser.id) {
                    try {
                      const { sendNotification } = await import("../lib/notifications");
                      await sendNotification({
                        userId: product.seller_id,
                        type: "comment",
                        title: "Novo comentário",
                        description: `Alguém comentou no seu produto ${product.name}.`,
                        productName: product.name,
                        productId: product.id,
                        senderId: currentUser.id
                      });
                    } catch (err) {
                      console.error("Erro ao notificar comentário:", err);
                    }
                  }
                } catch (err) {
                  console.error("Erro ao salvar comentário no Supabase:", err);
                }
                
                setNewCommentText("");
              }}
              className="flex gap-[6px] items-center py-2 shrink-0 border-none bg-transparent"
            >
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 bg-zinc-900/60 text-white rounded-[6px] px-3 py-2 text-[14px] font-hanken outline-none focus:bg-zinc-900"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="bg-white hover:bg-neutral-200 text-black px-4 py-2 rounded-[6px] text-[13px] font-black transition-all active:scale-95 disabled:opacity-40"
              >
                Enviar
              </button>
            </form>
          </div>
        )}

        {/* Modal/Overlay showing report form */}
        {showReportModal && (
          <div className="fixed inset-0 bg-neutral-950/98 flex flex-col z-50 p-[12px] justify-between max-w-md mx-auto animate-fade-in">
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center gap-[8px] py-[4px]">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-[4px] -ml-[4px] text-white hover:opacity-80 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center shrink-0 active:scale-95"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                </button>
                <div className="flex flex-col">
                  <h3 className="font-chivo text-[17px] font-black text-white leading-none">
                    {formatText("Denunciar Anúncio")}
                  </h3>
                  <span className="font-hanken text-[11px] text-neutral-400 mt-[2px] leading-none">
                    {formatText("Ajude-nos a manter a comunidade segura")}
                  </span>
                </div>
              </div>

              {reportSuccess ? (
                <div className="flex flex-col items-center justify-center gap-[8px] py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                    <Check className="w-6 h-6" strokeWidth={3} />
                  </div>
                  <h4 className="font-chivo text-[18px] font-black text-white mt-2">
                    {formatText("Denúncia Enviada")}
                  </h4>
                  <p className="font-hanken text-[13px] text-neutral-400 max-w-xs leading-relaxed">
                    {formatText("Agradecemos o seu feedback. A nossa equipa irá analisar o caso o mais breve possível.")}
                  </p>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="mt-4 bg-white hover:bg-neutral-200 text-black font-extrabold px-6 py-2.5 rounded-[8px] text-[13px] transition-all"
                  >
                    {formatText("Fechar")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-[8px] mt-2">
                  <span className="font-hanken text-[12px] font-black text-neutral-400 uppercase tracking-wider">
                    {formatText("Selecione O Motivo")}
                  </span>
                  
                  <div className="flex flex-col gap-[8px]">
                    {[
                      "Fraude ou golpe",
                      "Conteúdo proibido",
                      "Preço abusivo",
                      "Outro motivo"
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setReportReason(reason)}
                        className={`w-full text-left font-hanken text-[14px] px-3 py-2.5 rounded-[8px] border transition-all flex items-center justify-between ${
                          reportReason === reason 
                            ? "bg-white text-black border-white font-bold" 
                            : "bg-zinc-900/60 text-white border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <span>{formatText(reason)}</span>
                        {reportReason === reason && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-[8px] mt-2">
                    <span className="font-hanken text-[12px] font-black text-neutral-400 uppercase tracking-wider">
                      {formatText("Detalhes Adicionais (Opcional)")}
                    </span>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={4}
                      placeholder={formatText("Descreva o problema com mais detalhes...")}
                      className="w-full bg-zinc-900/60 text-white font-hanken text-[14px] p-3 rounded-[8px] border border-zinc-800 focus:outline-none focus:border-zinc-700 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>

            {!reportSuccess && (
              <div className="flex gap-[8px] py-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold py-3 rounded-[8px] text-[13px] uppercase tracking-wider transition-all"
                >
                  {formatText("Cancelar")}
                </button>
                <button
                  type="button"
                  disabled={submittingReport || !reportReason}
                  onClick={async () => {
                    if (!reportReason) return;
                    setSubmittingReport(true);
                    try {
                      const { error } = await supabase.from('denuncias').insert({
                        productId: product.id,
                        productName: product.name,
                        sellerId: product.seller_id || "",
                        sellerName: product.seller_name || "",
                        reporterId: currentUser?.id || "anonimo",
                        reporterName: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "Membro",
                        reason: reportReason,
                        details: reportDetails.trim()
                      });
                      if (error) throw error;
                      setReportSuccess(true);
                    } catch (err) {
                      console.error("Erro ao enviar denúncia:", err);
                    } finally {
                      setSubmittingReport(false);
                    }
                  }}
                  className="flex-1 bg-white hover:bg-neutral-200 text-black font-extrabold py-3 rounded-[8px] text-[13px] uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  {submittingReport ? formatText("Enviando...") : formatText("Enviar")}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. CUSTOMIZABLE AUTOMATIC MESSAGE - MAX 5PX SEPARATION */}
      {!isOwnProduct && (
        <section className="bg-transparent p-0 flex flex-col gap-[5px] w-full border-none shadow-none">
          <div className="flex flex-col gap-[5px] w-full mt-1">
            <span className="font-hanken text-[13px] md:text-[14px] font-black tracking-widest uppercase text-white/50 leading-none">
              {formatText("Mensagem Recomendada")}
            </span>
            <textarea
              value={autoMessage}
              onChange={(e) => setAutoMessage(e.target.value)}
              rows={2}
              className="w-full bg-zinc-800 text-white font-hanken text-[16px] md:text-[17px] py-2 px-3 rounded-[8px] border border-zinc-700 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed shadow-sm"
              placeholder="Digite sua mensagem personalizada..."
            />
          </div>
        </section>
      )}

        {/* 7. ACTION BUTTONS ROW (ENVIAR MENSAGEM & CONVERSAR) - MAX 5PX SEPARATION */}
        {!isOwnProduct && (
          <div className="grid grid-cols-2 gap-[5px] w-full mt-1">
            {onSendMessage ? (
              <button
                onClick={() => onSendMessage(autoMessage)}
                type="button"
                className="bg-white hover:bg-neutral-100 text-black font-extrabold py-3.5 rounded-[8px] text-[13px] md:text-[14px] uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border-none cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-black" strokeWidth={3} />
                <span>Enviar Mensagem</span>
              </button>
            ) : (
              <a
                href={`https://wa.me/${cleanPhone || "5511987216543"}?text=${encodeURIComponent(autoMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-neutral-100 text-black font-extrabold py-3.5 rounded-[8px] text-[13px] md:text-[14px] uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-5 h-5 text-black" strokeWidth={3} />
                <span>Enviar Mensagem</span>
              </a>
            )}

            {onSendMessage ? (
              <button
                onClick={() => onSendMessage("")}
                type="button"
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold py-3.5 rounded-[8px] text-[13px] md:text-[14px] uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border-none cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
                <span>Conversar</span>
              </button>
            ) : (
              <button
                onClick={() => {}}
                type="button"
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold py-3.5 rounded-[8px] text-[13px] md:text-[14px] uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border-none cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
                <span>Conversar</span>
              </button>
            )}
          </div>
        )}

        {/* 8. EMBEDDED LOCATION MAP WITH DARK STYLING - MAX 5PX SEPARATION */}
        <div className="flex flex-col gap-[5px] w-full mt-[5px]">
          <span className="font-hanken text-[11px] md:text-[12px] font-black tracking-widest uppercase text-white/50 leading-none">
            Localização ({product.location || "Lisboa"})
          </span>
          <div className="w-full h-[115px] rounded-[8px] overflow-hidden bg-zinc-900/40 relative">
            <iframe
              title="Mapa de Localização"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(product.location || "Lisboa")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
            />
          </div>
        </div>

        {/* 9. RELATED PRODUCTS LIST SECTION - MAX 5PX SEPARATION */}
        {allProducts && allProducts.filter((p: any) => p.id !== product.id).length > 0 && (
          <div className="flex flex-col gap-[5px] w-full mt-[5px]">
            <span className="font-hanken text-[11px] md:text-[12px] font-black tracking-widest uppercase text-white/50 leading-none">
              Sugestões Relacionadas
            </span>
            <div className="flex flex-col gap-[5px]">
              {allProducts
                .filter((p: any) => p.id !== product.id)
                .slice(0, 5)
                .map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct?.(p)}
                    className="bg-zinc-900/30 hover:bg-zinc-900/50 rounded-[8px] p-[8px] flex items-center gap-[8px] cursor-pointer transition-all active:scale-[0.99] border-none select-none"
                  >
                    <img
                      src={p.img || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                      alt={p.name}
                      className="w-16 h-16 rounded-[6px] object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-[2px]">
                      <div className="flex items-baseline justify-between gap-[8px]">
                        <h4 className="font-chivo text-[14px] font-bold text-white uppercase tracking-tight truncate leading-none">
                          {p.name}
                        </h4>
                        <span className="font-chivo text-[14px] font-black text-white shrink-0">
                          {p.price}
                        </span>
                      </div>
                      <p className="font-hanken text-[12px] text-zinc-400 truncate leading-tight mt-[2px]">
                        {p.desc || "Sem descrição disponível."}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }
