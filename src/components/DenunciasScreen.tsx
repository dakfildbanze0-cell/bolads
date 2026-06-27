import React, { useState, useEffect } from "react";
import { ArrowLeft, Send, AlertTriangle, MessageSquare, ShieldAlert, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Reply {
  id: string;
  sender_name: string;
  sender_avatar: string;
  message: string;
  created_at: string;
}

interface Denuncia {
  id: string;
  created_at: string;
  product_id?: string;
  product_name?: string;
  reporter_id?: string;
  reporter_name?: string;
  reason: string;
  details?: string;
  status?: string;
  replies?: Reply[];
  profiles?: {
    name: string;
    avatar_url: string;
  };
}

interface DenunciasScreenProps {
  user: any;
  userProfile: any;
  onBack: () => void;
}

export default function DenunciasScreen({ user, userProfile, onBack }: DenunciasScreenProps) {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDev = userProfile?.role === "developer";

  useEffect(() => {
    fetchDenuncias();
  }, []);

  const fetchDenuncias = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      
      const { data, error } = await supabase
        .from("denuncias")
        .select("*, profiles:reporter_id(name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDenuncias(data || []);
    } catch (err: any) {
      console.error("Erro Ao Buscar Denúncias:", err);
      setErrorMessage("Não Foi Possível Carregar As Denúncias.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDenuncia || !replyText.trim()) return;

    try {
      setSubmittingReply(true);
      setErrorMessage("");

      const newReply: Reply = {
        id: crypto.randomUUID(),
        sender_name: isDev ? "Desenvolvedor" : userProfile?.name || "Usuário",
        sender_avatar: userProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
        message: replyText.trim(),
        created_at: new Date().toISOString()
      };

      const updatedReplies = [...(selectedDenuncia.replies || []), newReply];

      const { error } = await supabase
        .from("denuncias")
        .update({ replies: updatedReplies })
        .eq("id", selectedDenuncia.id);

      if (error) throw error;

      const updatedDenuncia = { ...selectedDenuncia, replies: updatedReplies };
      setSelectedDenuncia(updatedDenuncia);
      setDenuncias((prev) => prev.map((d) => (d.id === selectedDenuncia.id ? updatedDenuncia : d)));
      setReplyText("");
    } catch (err: any) {
      console.error("Erro Ao Responder Denúncia:", err);
      setErrorMessage("Erro Ao Enviar Resposta. Sem Permissão.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleStatus = async (denuncia: Denuncia, nextStatus: string) => {
    try {
      setErrorMessage("");
      const { error } = await supabase
        .from("denuncias")
        .update({ status: nextStatus })
        .eq("id", denuncia.id);

      if (error) throw error;

      const updatedDenuncia = { ...denuncia, status: nextStatus };
      if (selectedDenuncia?.id === denuncia.id) {
        setSelectedDenuncia(updatedDenuncia);
      }
      setDenuncias((prev) => prev.map((d) => (d.id === denuncia.id ? updatedDenuncia : d)));
    } catch (err: any) {
      console.error("Erro Ao Alterar Estado:", err);
      setErrorMessage("Sem Permissão Para Mudar Estado.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-[8px] bg-transparent flex flex-col gap-[8px] animate-fade-in font-sans min-h-[calc(100vh-60px)] text-white">
      {/* Header with Back Button */}
      <div className="flex items-center gap-[8px] pb-[8px] bg-transparent">
        <button
          type="button"
          onClick={selectedDenuncia ? () => setSelectedDenuncia(null) : onBack}
          className="flex items-center gap-[6px] text-white hover:text-neutral-200 text-[15px] bg-transparent border-none cursor-pointer leading-none active:scale-95 transition-all font-normal"
        >
          <ArrowLeft className="w-5 h-5 text-white shrink-0" strokeWidth={4} />
          <span className="text-white select-none leading-none tracking-wide font-bold">
            {selectedDenuncia ? "Voltar Às Denúncias" : "Voltar Ao Menu"}
          </span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-[8px] bg-zinc-950 border border-zinc-800 rounded-[8px] text-zinc-300 text-[13px] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-white" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!selectedDenuncia ? (
        <div className="flex flex-col gap-[8px]">
          {/* Title */}
          <h3 className="font-chivo text-[18px] font-black text-white px-[4px] mt-[4px]">
            Painel De Denúncias
          </h3>

          <div className="flex flex-col gap-[8px]">
            <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              {isDev ? "Todas As Denúncias Do Sistema" : "Minhas Denúncias Enviadas"}
            </span>

            {loading ? (
              <div className="text-center py-4 text-zinc-400 text-[14px]">
                A Carregar Lista De Denúncias...
              </div>
            ) : denuncias.length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-[14px] bg-zinc-900 rounded-[8px] border border-zinc-800">
                Nenhuma Denúncia Relatada Ainda
              </div>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {denuncias.map((item) => {
                  const prodName = item.product_name || "Anúncio";
                  const repName = item.reporter_name || item.profiles?.name || "Usuário";
                  const itemStatus = item.status || "Aberto";
                  const itemReplies = item.replies || [];

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedDenuncia(item)}
                      className="flex flex-col gap-[8px] p-[10px] bg-zinc-900 hover:bg-zinc-850 rounded-[8px] border border-zinc-800 cursor-pointer transition-all duration-150"
                    >
                      <div className="flex justify-between items-start gap-[8px]">
                        <span className="font-bold text-[15px] text-white leading-tight">
                          {prodName}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-[8px] py-[2px] rounded-full shrink-0 ${
                            itemStatus === "Resolvido"
                              ? "bg-zinc-850 text-zinc-400 border border-zinc-700"
                              : itemStatus === "Analisando"
                              ? "bg-zinc-800 text-zinc-300 border border-zinc-650"
                              : "bg-white text-black font-extrabold"
                          }`}
                        >
                          {itemStatus}
                        </span>
                      </div>

                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Motivo
                        </span>
                        <p className="text-[13px] text-zinc-350 leading-snug">
                          {item.reason}
                        </p>
                      </div>

                      {item.details && (
                        <p className="text-[12px] text-zinc-450 line-clamp-1">
                          {item.details}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/50">
                        <span>Denunciante: {repName}</span>
                        <div className="flex items-center gap-[4px] text-zinc-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{itemReplies.length} Respostas</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Denuncia Detail and Discussion View */
        <div className="flex flex-col gap-[8px] animate-fade-in">
          {/* Main Denuncia Card */}
          <div className="flex flex-col gap-[8px] bg-zinc-900 p-[12px] rounded-[8px] border border-zinc-800">
            <div className="flex justify-between items-start gap-[8px]">
              <div className="flex flex-col">
                <span className="font-black text-[18px] text-white leading-tight">
                  {selectedDenuncia.product_name || "Anúncio Denunciado"}
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5">
                  Motivo: {selectedDenuncia.reason}
                </span>
              </div>
              
              <span
                className={`text-[11px] font-bold px-[10px] py-[4px] rounded-[8px] shrink-0 ${
                  (selectedDenuncia.status || "Aberto") === "Resolvido"
                    ? "bg-zinc-850 text-zinc-400"
                    : (selectedDenuncia.status || "Aberto") === "Analisando"
                    ? "bg-zinc-800 text-zinc-300"
                    : "bg-white text-black font-extrabold"
                }`}
              >
                {selectedDenuncia.status || "Aberto"}
              </span>
            </div>

            {selectedDenuncia.details && (
              <p className="text-[14px] text-zinc-300 whitespace-pre-line leading-relaxed bg-zinc-950 p-[8px] rounded-[8px] border border-zinc-800">
                {selectedDenuncia.details}
              </p>
            )}

            <div className="flex items-center gap-[6px] text-[11px] text-zinc-500">
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              <span>Relatado Por {selectedDenuncia.reporter_name || selectedDenuncia.profiles?.name || "Usuário"}</span>
            </div>

            {/* Dev Controls for Status */}
            {isDev && (
              <div className="flex flex-col gap-[4px] pt-2 border-t border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">
                  Mudar Estado Da Denúncia
                </span>
                <div className="flex gap-[4px]">
                  {["Aberto", "Analisando", "Resolvido", "Ignorado"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleToggleStatus(selectedDenuncia, st)}
                      className={`flex-1 py-[6px] text-[11px] font-bold rounded-[8px] border-none cursor-pointer transition-all active:scale-95 ${
                        (selectedDenuncia.status || "Aberto") === st
                          ? "bg-white text-black font-extrabold"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Replies Section */}
          <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px] border border-zinc-800">
            <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Discussão E Respostas Do Desenvolvedor
            </span>

            {/* List of Replies */}
            <div className="flex flex-col gap-[8px] max-h-[300px] overflow-y-auto pr-1">
              {!selectedDenuncia.replies || selectedDenuncia.replies.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-[13px]">
                  Nenhuma Resposta Ainda. Escreva Uma Resposta Abaixo.
                </div>
              ) : (
                selectedDenuncia.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="flex flex-col gap-[4px] p-[8px] bg-zinc-950 rounded-[8px] border border-zinc-800"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-[6px]">
                        <img
                          src={reply.sender_avatar}
                          className="w-5 h-5 rounded-full object-cover"
                          alt=""
                        />
                        <span className="text-[12px] font-bold text-zinc-200">
                          {reply.sender_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(reply.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-[13px] text-zinc-350 leading-snug pl-1">
                      {reply.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Send Reply Form */}
            <form onSubmit={handleSendReply} className="flex gap-[6px] mt-1">
              <input
                type="text"
                placeholder="Escrever Resposta..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                required
                className="flex-1 p-[8px] bg-zinc-800 rounded-[8px] text-white text-[14px] focus:outline-none border border-zinc-700"
              />
              <button
                type="submit"
                disabled={submittingReply}
                className="p-[8px] bg-white hover:bg-zinc-200 text-black rounded-[8px] cursor-pointer transition-all active:scale-95 border-none flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-black" strokeWidth={3} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
