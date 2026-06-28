import React, { useState, useRef, useEffect, ReactElement } from "react";
import { Search, MessageCircle, ArrowLeft, Send, Check, X, Video, Mic, Image, Smile, MoreVertical } from "lucide-react";
import { supabase } from "../lib/supabase";
import { CATEGORIES } from "../types";
import {
  Conversation,
  Message,
  getConversationsListener,
  getMessagesListener,
  sendMessage,
  markAsRead
} from "../lib/chatService";

interface ChatScreenProps {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  onBack: () => void;
  currentUser?: any;
}

export default function ChatScreen({
  conversations = [],
  setConversations,
  activeChatId,
  setActiveChatId,
  onBack,
  currentUser
}: ChatScreenProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isVideoCalling, setIsVideoCalling] = useState(false);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [activeProfileInfo, setActiveProfileInfo] = useState<{ name: string; avatar: string; isOnline: boolean } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Listen to active conversation messages in real-time
  useEffect(() => {
    if (!activeChatId) {
      setActiveMessages([]);
      return;
    }

    if (currentUser) {
      markAsRead(activeChatId, currentUser.id).catch((err) => {
        console.error("Erro ao marcar conversas lidas:", err);
      });
    }

    const unsubscribe = getMessagesListener(activeChatId, (messages) => {
      setActiveMessages(messages);
    });

    return unsubscribe;
  }, [activeChatId, currentUser?.id]);

  // Handle auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, activeChatId]);

  const activeConv = conversations.find((c) => c.id === activeChatId);

  useEffect(() => {
    let unsubscribeProfile = () => {};

    if (activeConv && currentUser) {
      const otherId = activeConv.participantes?.find((id: string) => id !== currentUser.id);
      
      if (otherId && !otherId.startsWith("virtual_")) {
        const fetchProfile = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, isonline')
            .eq('id', otherId)
            .single();
          
          if (data) {
            setActiveProfileInfo({
              name: data.name || activeConv.name || "Usuário",
              avatar: data.avatar_url || activeConv.img || "",
              isOnline: data.isonline === true
            });
          }
        };

        fetchProfile();

        const channel = supabase
          .channel(`profile_chat_${otherId}`)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${otherId}` 
          }, () => {
            fetchProfile();
          })
          .subscribe();

        unsubscribeProfile = () => supabase.removeChannel(channel);
      } else {
        // Fallback for virtual or missing users
        setActiveProfileInfo(null);
      }
    } else {
      setActiveProfileInfo(null);
    }

    return () => unsubscribeProfile();
  }, [activeConv?.id, currentUser?.id]);

  // Helper to get initials
  const getAvatar = (conv: Conversation, size: "xs" | "sm" | "lg" = "lg", useProfile: boolean = false) => {
    const nameToUse = useProfile && activeProfileInfo ? activeProfileInfo.name : (conv.name || "Usuário");
    const imgToUse = useProfile && activeProfileInfo ? activeProfileInfo.avatar : conv.img;

    const defaultPlaceholder = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
    const defaultPlaceholder2 = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
    const hasAvatar = imgToUse && imgToUse.trim() !== "" && imgToUse !== defaultPlaceholder && imgToUse !== defaultPlaceholder2;

    const initial = nameToUse.trim().charAt(0).toUpperCase();
    const dimensions = size === "xs" ? "w-[24px] h-[24px]" : size === "sm" ? "w-[36px] h-[36px]" : "w-[48px] h-[48px]";
    
    if (hasAvatar) {
      return (
        <div className={`${dimensions} shrink-0 bg-zinc-800 flex items-center justify-center rounded-full overflow-hidden`}>
          <img
            src={imgToUse}
            alt={nameToUse}
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    // Hash color for initials
    const colors = [
      "bg-red-500 text-white",
      "bg-orange-500 text-white",
      "bg-amber-500 text-white",
      "bg-emerald-500 text-white",
      "bg-teal-500 text-white",
      "bg-blue-500 text-white",
      "bg-indigo-500 text-white",
      "bg-purple-500 text-white",
      "bg-pink-500 text-white",
      "bg-rose-500 text-white",
    ];
    let hash = 0;
    for (let i = 0; i < nameToUse.length; i++) {
      hash = nameToUse.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const colorClass = colors[colorIndex];

    const textSizes = size === "xs" ? "text-[10px]" : size === "sm" ? "text-[12px]" : "text-[15px]";

    return (
      <div className={`${dimensions} shrink-0 ${colorClass} flex items-center justify-center rounded-full overflow-hidden font-bold select-none text-center ${textSizes}`}>
        {initial}
      </div>
    );
  };

  const getQuickMessages = (conv?: Conversation) => {
    const defaultReplies = [
      { label: "Olá! Está disponível? 😊" },
      { label: "Quero fechar negócio! 🔥" },
      { label: "Qual o melhor valor que faz? 💰" },
      { label: "Onde podemos combinar a entrega? 🚚" }
    ];

    if (!conv?.product) return defaultReplies;

    return [
      { label: `Ainda está disponível?` },
      { label: `Aceita proposta no valor?` },
      { label: `Consigo retirar hoje!` },
      { label: `Está em bom estado?` }
    ];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || !currentUser) return;

    try {
      const msgText = inputText;
      setInputText("");
      await sendMessage(activeChatId, currentUser.id, msgText, "texto");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const [activeTab, setActiveTab] = useState<"todas" | "nao_lidas" | "categorias">("todas");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const sendQuickMessage = async (text: string) => {
    if (!text.trim() || !activeChatId || !currentUser) return;

    try {
      await sendMessage(activeChatId, currentUser.id, text, "texto");
    } catch (err) {
      console.error("Erro ao enviar mensagem rápida:", err);
    }
  };

  const filtered = conversations.filter((c) => {
    // 1. Search Query Filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch = (c.name || "").toLowerCase().includes(q);
      const msgMatch = (c.ultimaMensagem || "").toLowerCase().includes(q);
      const prodMatch = c.product && (c.product.name || "").toLowerCase().includes(q);
      if (!nameMatch && !msgMatch && !prodMatch) {
        return false;
      }
    }

    // 2. Tab Filter
    if (activeTab === "nao_lidas") {
      return (c.unread || 0) > 0;
    } else if (activeTab === "categorias") {
      if (selectedCategory) {
        const prodCat = c.product?.category;
        return prodCat && prodCat.toLowerCase() === selectedCategory.toLowerCase();
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col relative w-full h-full px-[5px] pb-[5px]">
      {activeConv ? (
        /* INSTANT DETAILED CHAT CHANNEL VIEW */
        <div className="flex flex-col bg-transparent relative w-full h-full overflow-hidden">
          {/* Video Call Overlay */}
          {isVideoCalling && (
            <div className="absolute inset-0 bg-black/95 z-50 rounded-[8px] flex flex-col items-center justify-between p-6 animate-fade-in">
              <div className="flex-1 flex flex-col items-center justify-center gap-[8px] text-center mt-10">
                <div className="relative shrink-0 border border-zinc-750 p-1 rounded-[8px]">
                  {getAvatar(activeConv, "lg", true)}
                </div>
                <div>
                  <h3 className="font-chivo text-[16px] font-black text-white tracking-wider">
                    {activeProfileInfo ? activeProfileInfo.name : activeConv.name}
                  </h3>
                  <p className="font-sans text-[10px] text-white/80 font-bold tracking-widest mt-1 animate-pulse">
                    Conectando chamada de vídeo...
                  </p>
                </div>
              </div>

              {/* End Video Call Button */}
              <button
                onClick={() => setIsVideoCalling(false)}
                className="w-12 h-12 bg-zinc-800 hover:bg-zinc-750 text-white rounded-[8px] flex items-center justify-center shadow-lg transition-all cursor-pointer border-none mb-4"
                title="Desligar"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          )}

          {/* Header Bar - max 8px spacing */}
          <div className="flex items-center justify-between py-2 sticky top-0 bg-transparent z-10 rounded-[8px] mb-[5px] gap-[5px]">
            <div className="flex items-center gap-[5px]">
              <button
                onClick={() => setActiveChatId(null)}
                className="p-1 hover:bg-zinc-900 rounded-[8px] text-white cursor-pointer transition-colors border-none bg-transparent"
                title="Voltar"
              >
                <ArrowLeft className="w-[24px] h-[24px] text-white" />
              </button>
              <div className="relative shrink-0">
                {getAvatar(activeConv, "sm", true)}
                {activeProfileInfo?.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-chivo text-sm font-black text-white leading-tight">
                  {activeProfileInfo ? activeProfileInfo.name : activeConv.name}
                </span>
                {activeProfileInfo?.isOnline ? (
                  <span className="text-[9px] font-extrabold tracking-wider text-emerald-500">Online</span>
                ) : (
                  <span className="text-[9px] font-extrabold tracking-wider text-zinc-500">Offline</span>
                )}
              </div>
            </div>

            {/* Header Right Actions - styled beautifully with max 8px spacing */}
            <div className="flex items-center gap-[8px] shrink-0">
              <button
                type="button"
                onClick={() => setIsVideoCalling(true)}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-zinc-900 rounded-[8px] transition-colors cursor-pointer border-none bg-transparent"
                title="Chamada de vídeo"
              >
                <Video className="w-[20px] h-[20px] text-white" />
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-zinc-900 rounded-[8px] transition-colors cursor-pointer border-none bg-transparent"
                title="Mais opções"
              >
                <MoreVertical className="w-[20px] h-[20px] text-white" />
              </button>
            </div>
          </div>

          {/* Fixed Product Details - max 8px spacing */}
          {activeConv.product && (
            <div className="mb-[8px] p-3 bg-transparent border border-zinc-800 rounded-[8px] flex items-center gap-[10px] select-none relative z-10 shrink-0">
              <img
                src={activeConv.product.img}
                alt={activeConv.product.name}
                className="w-14 h-14 object-cover rounded-[8px] shrink-0 font-sans"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-baseline justify-between gap-[8px]">
                  <h4 className="font-chivo text-[15px] md:text-[16px] font-black text-white tracking-tight truncate">
                    {activeConv.product.name}
                  </h4>
                  <span className="font-chivo text-[15px] md:text-[16px] font-black text-white shrink-0">
                    {activeConv.product.price}
                  </span>
                </div>
                <p className="font-hanken text-[13px] md:text-[14px] text-zinc-400 line-clamp-1 truncate mt-[4px] font-medium leading-tight">
                  {activeConv.product.desc || "Sem descrição disponível."}
                </p>
              </div>
            </div>
          )}

          {/* Message Thread Scroll Area - max 8px spacing */}
          <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-[5px] no-scrollbar">
            {activeMessages && activeMessages.length > 0 ? (
              activeMessages.map((m) => {
                const isMe = m.senderId === currentUser?.id || m.sender === "me";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-[5px] w-[95%] md:w-[90%] ${isMe ? "ml-auto justify-end" : "mr-auto justify-start"}`}
                  >
                    {!isMe && (
                      <div className="shrink-0 mb-[1px]" title={activeConv.name}>
                        {getAvatar(activeConv, "xs")}
                      </div>
                    )}
                    <div className={`flex flex-col gap-[3px] max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`py-1.5 px-3 rounded-[8px] text-[14px] md:text-[15px] leading-relaxed font-hanken shrink-0 w-fit max-w-full ${
                          isMe
                            ? "bg-white text-black"
                            : "bg-zinc-900 text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.conteudo}</p>
                      </div>
                      <div className="flex items-center gap-[4px] opacity-65 text-[10px] font-mono px-1">
                        <span>{m.time}</span>
                        {isMe && <Check className="w-3 h-3 text-zinc-400" />}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center opacity-60 py-10 gap-[8px]">
                <MessageCircle className="w-8 h-8 text-neutral-400" />
                <p className="text-xs font-hanken">Nenhuma mensagem ainda neste canal</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick response messages (gray background, short, with emojis) - max 8px spacing */}
          <div className="flex gap-[5px] overflow-x-auto pb-[4px] px-[5px] pt-[2px] no-scrollbar shrink-0 select-none">
            {getQuickMessages(activeConv).map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendQuickMessage(m.label)}
                className="px-3 py-1 bg-zinc-850 hover:bg-zinc-750 text-neutral-200 rounded-[8px] text-xs font-bold font-hanken tracking-tight whitespace-nowrap cursor-pointer transition-colors border border-zinc-800/50"
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Bottom Chat Message Input Row filled with adjacent icons - max 8px spacing */}
          <div className="flex items-center gap-[5px] px-[2px] pb-[4px] mt-[5px] shrink-0 bg-transparent select-none">
            {/* Left side actions */}
            <div className="flex items-center gap-[4px] shrink-0">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-zinc-900 rounded-[8px] transition-colors cursor-pointer border-none bg-transparent"
                title="Inserir imagem"
              >
                <Image className="w-[20px] h-[18px] text-white" />
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-zinc-900 rounded-[8px] transition-colors cursor-pointer border-none bg-transparent"
                title="Inserir emoji"
              >
                <Smile className="w-[18px] h-[20px] text-white" />
              </button>
            </div>

            {/* Input form with 8px rounded corners and subtle gray styling */}
            <form
              onSubmit={handleSendMessage}
              className="flex-1 flex items-center bg-zinc-900 rounded-[8px] px-4 py-2 min-w-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className="flex-1 bg-transparent text-white text-[16px] md:text-[18px] focus:outline-none border-none placeholder:text-zinc-500 font-hanken font-bold min-w-0 ring-0"
              />
            </form>

            {/* Right side actions */}
            <div className="shrink-0 flex items-center justify-center min-w-[32px]">
              {inputText.trim() ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendMessage(e);
                  }}
                  type="submit"
                  className="w-8 h-8 bg-white text-black rounded-[8px] flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer border-none"
                  title="Enviar"
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              ) : (
                <button
                  type="button"
                  className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[8px] flex items-center justify-center transition-colors cursor-pointer border-none"
                  title="Gravar áudio"
                >
                  <Mic className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CHANNEL LIST COMPONENT VIEW */
        <>
          {/* Top header with Back Icon, Screen Name and Search - Max 8px separation */}
          <div className="flex items-center justify-between py-2 bg-transparent select-none mb-[2px]">
            <div className="flex items-center gap-[5px]">
              <button
                onClick={onBack}
                className="p-1 hover:bg-zinc-900 rounded-[8px] text-white cursor-pointer transition-all border-none bg-transparent"
                title="Voltar"
              >
                <ArrowLeft className="w-[24px] h-[24px] text-white" />
              </button>
              <span className="font-chivo text-base font-black tracking-tight text-white">
                Mensagens
              </span>
            </div>
            {/* Header Right Actions */}
            <div className="flex items-center gap-[5px] shrink-0">
              <button
                onClick={() => {
                  setIsSearching(!isSearching);
                  if (isSearching) {
                    setSearchQuery("");
                  }
                }}
                className={`w-8 h-8 flex items-center justify-center hover:bg-zinc-900 rounded-[8px] cursor-pointer transition-all border-none bg-transparent ${isSearching ? "text-zinc-300 bg-zinc-800" : "text-white"}`}
                title="Pesquisar"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-zinc-900 rounded-[8px] transition-colors cursor-pointer border-none bg-transparent"
                title="Mais opções"
              >
                <MoreVertical className="w-[18px] h-[18px] text-white" />
              </button>
            </div>
          </div>

          {/* Gray Background Search Bar */}
          {isSearching && (
            <div className="flex items-center bg-zinc-900 rounded-[8px] px-3 py-1.5 mb-[5px] gap-[5px] animate-fade-in">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar conversas..."
                autoFocus
                className="flex-1 bg-transparent text-white text-xs focus:outline-none border-none placeholder:text-neutral-500 font-hanken font-bold py-1 ring-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full bg-transparent border-none cursor-pointer"
                  title="Limpar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Tabs - sentence case, max 8px spacing, no pink, white/gray highlights */}
          <div className="flex items-center gap-[12px] mb-[8px] border-b border-zinc-800 px-[2px]">
            <button
              onClick={() => {
                setActiveTab("todas");
                setSelectedCategory(null);
              }}
              className={`pb-[8px] font-hanken text-[13px] font-bold transition-colors border-b-2 cursor-pointer ${
                activeTab === "todas" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => {
                setActiveTab("nao_lidas");
                setSelectedCategory(null);
              }}
              className={`pb-[8px] font-hanken text-[13px] font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-[4px] ${
                activeTab === "nao_lidas" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              Não lidas
              {conversations.some((c) => (c.unread || 0) > 0) && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-[4px] py-[1px] rounded-full min-w-[16px] text-center">
                  {conversations.filter((c) => (c.unread || 0) > 0).length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("categorias");
              }}
              className={`pb-[8px] font-hanken text-[13px] font-bold transition-colors border-b-2 cursor-pointer ${
                activeTab === "categorias" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              Todas as categorias
            </button>
          </div>

          {/* Category Chips */}
          {activeTab === "categorias" && (
            <div className="flex items-center gap-[8px] py-[4px] overflow-x-auto no-scrollbar mb-[8px] select-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`font-hanken text-[12px] font-bold px-[12px] py-[6px] rounded-[8px] whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === null
                    ? "bg-white text-black font-extrabold"
                    : "bg-zinc-800 text-neutral-300 hover:text-white"
                }`}
              >
                Todas
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`font-hanken text-[12px] font-bold px-[12px] py-[6px] rounded-[8px] whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.name
                      ? "bg-white text-black font-extrabold"
                      : "bg-zinc-800 text-neutral-300 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Conversation List - No borders or lines, max 8px spacing */}
          <div className="flex flex-col gap-[5px]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-[24px] text-center gap-[8px] rounded-[8px]">
                <MessageCircle className="w-8 h-8 text-neutral-600" />
                <p className="font-hanken text-[13px] text-neutral-400">
                  {activeTab === "nao_lidas" 
                    ? "Nenhuma conversa não lida." 
                    : activeTab === "categorias" && selectedCategory
                    ? `Nenhuma conversa encontrada em "${selectedCategory}".`
                    : "Nenhuma conversa encontrada."}
                </p>
              </div>
            ) : (
              filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setActiveChatId(c.id);
                }}
                className="group bg-zinc-950/25 hover:bg-zinc-900/50 transition-all duration-200 cursor-pointer p-[5px] flex gap-[5px] items-center relative overflow-hidden rounded-[8px]"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {getAvatar(c, "lg")}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex justify-between items-center leading-none mb-1 md:mb-1.5">
                    <span className="font-chivo text-[15px] font-extrabold text-white truncate max-w-[70%]">
                      {c.name}
                    </span>
                    <span className="font-hanken text-[10px] text-white/60 tracking-tight font-extrabold">
                      {c.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-[8px]">
                      <p className="font-hanken text-[12px] text-white/90 truncate pr-[5px] font-semibold leading-none">
                        {c.ultimaMensagem}
                      </p>
                    {(c.unread || 0) > 0 && (
                      <div className="bg-[#ec4899] text-white text-[9px] font-black px-1.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center shrink-0">
                        {c.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </>
      )}
    </div>
  );
}
