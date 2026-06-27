import React, { useState, useEffect } from "react";
import { ArrowLeft, Send, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Bug {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  replies: Array<{
    id: string;
    sender_name: string;
    sender_avatar: string;
    message: string;
    created_at: string;
  }>;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url: string;
  };
}

interface BugsScreenProps {
  user: any;
  userProfile: any;
  onBack: () => void;
}

export default function BugsScreen({ user, userProfile, onBack }: BugsScreenProps) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDev = userProfile?.role === "developer";

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      // Fetch bugs with sender profile info
      const { data, error } = await supabase
        .from("bugs")
        .select("*, profiles:user_id(name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBugs(data || []);
    } catch (err: any) {
      console.error("Erro Ao Procurar Bugs:", err);
      setErrorMessage("Não Foi Possível Carregar Os Bugs.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      setSubmittingBug(true);
      setErrorMessage("");
      const newBug = {
        user_id: user?.id,
        title: newTitle.trim(),
        description: newDesc.trim(),
        status: "Aberto",
        replies: []
      };

      const { data, error } = await supabase
        .from("bugs")
        .insert(newBug)
        .select("*, profiles:user_id(name, avatar_url)")
        .single();

      if (error) throw error;

      setBugs((prev) => [data, ...prev]);
      setNewTitle("");
      setNewDesc("");
    } catch (err: any) {
      console.error("Erro Ao Criar Bug:", err);
      setErrorMessage("Erro Ao Enviar O Bug. Tente Novamente.");
    } finally {
      setSubmittingBug(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBug || !replyText.trim()) return;

    try {
      setSubmittingReply(true);
      setErrorMessage("");
      const newReply = {
        id: crypto.randomUUID(),
        sender_name: isDev ? "Desenvolvedor" : userProfile?.name || "Usuário",
        sender_avatar: userProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
        message: replyText.trim(),
        created_at: new Date().toISOString()
      };

      const updatedReplies = [...(selectedBug.replies || []), newReply];

      const { error } = await supabase
        .from("bugs")
        .update({ replies: updatedReplies })
        .eq("id", selectedBug.id);

      if (error) throw error;

      // Update local state
      const updatedBug = { ...selectedBug, replies: updatedReplies };
      setSelectedBug(updatedBug);
      setBugs((prev) => prev.map((b) => (b.id === selectedBug.id ? updatedBug : b)));
      setReplyText("");
    } catch (err: any) {
      console.error("Erro Ao Responder Bug:", err);
      setErrorMessage("Erro Ao Responder. Sem Permissão.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleStatus = async (bug: Bug) => {
    try {
      setErrorMessage("");
      const nextStatus = bug.status === "Aberto" ? "Resolvido" : "Aberto";
      const { error } = await supabase
        .from("bugs")
        .update({ status: nextStatus })
        .eq("id", bug.id);

      if (error) throw error;

      const updatedBug = { ...bug, status: nextStatus };
      if (selectedBug?.id === bug.id) {
        setSelectedBug(updatedBug);
      }
      setBugs((prev) => prev.map((b) => (b.id === bug.id ? updatedBug : b)));
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
          onClick={selectedBug ? () => setSelectedBug(null) : onBack}
          className="flex items-center gap-[6px] text-white hover:text-neutral-200 text-[15px] bg-transparent border-none cursor-pointer leading-none active:scale-95 transition-all font-normal"
        >
          <ArrowLeft className="w-5 h-5 text-white shrink-0" strokeWidth={4} />
          <span className="text-white select-none leading-none tracking-wide font-bold">
            {selectedBug ? "Voltar Aos Bugs" : "Voltar Ao Menu"}
          </span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-[8px] bg-zinc-950 border border-zinc-800 rounded-[8px] text-zinc-300 text-[13px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-white" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!selectedBug ? (
        <div className="flex flex-col gap-[8px]">
          {/* Title */}
          <h3 className="font-chivo text-[18px] font-black text-white px-[4px] mt-[4px]">
            Relatar Problemas E Bugs
          </h3>

          {/* Bug Form */}
          <form
            onSubmit={handleCreateBug}
            className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px] border border-zinc-800"
          >
            <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Descrever Novo Bug
            </span>

            <input
              type="text"
              placeholder="Título Do Problema"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="p-[8px] bg-zinc-800 rounded-[8px] text-white text-[14px] focus:outline-none border border-zinc-700"
            />

            <textarea
              placeholder="Descreva O Que Aconteceu Em Detalhes..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              required
              rows={3}
              className="p-[8px] bg-zinc-800 rounded-[8px] text-white text-[14px] focus:outline-none resize-none border border-zinc-700"
            />

            <button
              type="submit"
              disabled={submittingBug}
              className="w-full py-[10px] bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold text-[14px] rounded-[8px] cursor-pointer transition-all active:scale-95 border-none flex items-center justify-center gap-2"
            >
              <span>Relatar Bug</span>
            </button>
          </form>

          {/* Bugs List */}
          <div className="flex flex-col gap-[8px]">
            <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Histórico De Bugs Relatados
            </span>

            {loading ? (
              <div className="text-center py-4 text-zinc-400 text-[14px]">
                A Carregar Lista De Bugs...
              </div>
            ) : bugs.length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-[14px] bg-zinc-900 rounded-[8px] border border-zinc-800">
                Nenhum Bug Relatado Ainda
              </div>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {bugs.map((bug) => (
                  <div
                    key={bug.id}
                    onClick={() => setSelectedBug(bug)}
                    className="flex flex-col gap-[8px] p-[10px] bg-zinc-900 hover:bg-zinc-850 rounded-[8px] border border-zinc-800 cursor-pointer transition-all duration-150"
                  >
                    <div className="flex justify-between items-start gap-[8px]">
                      <span className="font-bold text-[15px] text-white leading-tight">
                        {bug.title}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-[8px] py-[2px] rounded-full shrink-0 ${
                          bug.status === "Resolvido"
                            ? "bg-zinc-850 text-zinc-400 border border-zinc-700"
                            : "bg-white text-black font-extrabold"
                        }`}
                      >
                        {bug.status}
                      </span>
                    </div>

                    <p className="text-[13px] text-zinc-350 line-clamp-2 leading-snug">
                      {bug.description}
                    </p>

                    <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/50">
                      <span>Relatado Por {bug.profiles?.name || "Usuário"}</span>
                      <div className="flex items-center gap-[4px] text-zinc-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{bug.replies?.length || 0} Respostas</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Bug Detail and Discussion View */
        <div className="flex flex-col gap-[8px] animate-fade-in">
          {/* Main Bug Card */}
          <div className="flex flex-col gap-[8px] bg-zinc-900 p-[12px] rounded-[8px] border border-zinc-800">
            <div className="flex justify-between items-start gap-[8px]">
              <span className="font-black text-[18px] text-white leading-tight">
                {selectedBug.title}
              </span>
              {(isDev || selectedBug.user_id === user?.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(selectedBug);
                  }}
                  className={`text-[11px] font-bold px-[10px] py-[4px] rounded-[8px] shrink-0 border-none cursor-pointer transition-all active:scale-95 ${
                    selectedBug.status === "Resolvido"
                      ? "bg-zinc-850 text-zinc-400"
                      : "bg-white text-black font-extrabold"
                  }`}
                >
                  {selectedBug.status} (Mudar)
                </button>
              )}
            </div>

            <p className="text-[14px] text-zinc-300 whitespace-pre-line leading-relaxed bg-zinc-950 p-[8px] rounded-[8px] border border-zinc-800">
              {selectedBug.description}
            </p>

            <div className="flex items-center gap-[6px] text-[11px] text-zinc-500">
              <img
                src={selectedBug.profiles?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                className="w-4 h-4 rounded-full object-cover"
                alt=""
              />
              <span>Relatado Por {selectedBug.profiles?.name || "Usuário"}</span>
            </div>
          </div>

          {/* Replies Section */}
          <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px] border border-zinc-800">
            <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Discussão E Respostas
            </span>

            {/* List of Replies */}
            <div className="flex flex-col gap-[8px] max-h-[300px] overflow-y-auto pr-1">
              {!selectedBug.replies || selectedBug.replies.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-[13px]">
                  Nenhuma Resposta Ainda. Escreva Uma Resposta Abaixo.
                </div>
              ) : (
                selectedBug.replies.map((reply) => (
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
