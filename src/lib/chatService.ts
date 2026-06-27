import { supabase } from "./supabase";

export interface Message {
  id: string;
  senderId: string;
  conversaId: string;
  conteudo: string;
  text: string; // compatibility
  tipo: "texto" | "imagem" | "audio";
  type: string; // compatibility
  dataEnvio: any;
  timestamp: any; // compatibility
  status: "enviada" | "entregue" | "lida";
  senderName?: string;
  time?: string;
}

export interface Conversation {
  id: string;
  participantes: string[];
  ultimaMensagem: string;
  dataUltimaAtualizacao: any;
  naoLidas: Record<string, number>;
  nomesParticipantes: Record<string, string>;
  imagensParticipantes: Record<string, string>;
  name?: string; // other participant's name
  img?: string; // other participant's avatar
  messages?: Message[];
  product?: any;
  time?: string;
  unread?: number;
}

// Check or create conversation with standard deterministic ID for 1-to-1 chats
export async function createOrGetConversation(
  seller_id: string | null,
  sellerName: string,
  sellerAvatar: string,
  productData?: any
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const buyerId = user.id;
  let buyerName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Comprador";
  let buyerAvatar = user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";

  // If no seller ID exists (e.g. static products), use a deterministic string based on their name
  const final_seller_id = seller_id || `virtual_${sellerName.toLowerCase().replace(/\s+/g, "_")}`;
  
  let finalSellerName = sellerName;
  let finalSellerAvatar = sellerAvatar;

  // Deterministic chat ID based on both participants
  const sortedIds = [buyerId, final_seller_id].sort();
  const conversaId = `conversa_${sortedIds[0]}_${sortedIds[1]}`;

  const { data: conv, error: fetchError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', conversaId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error("Erro ao buscar conversa existente:", fetchError);
    throw fetchError;
  }

  const attachedProduct = productData ? {
    id: productData.id,
    name: productData.name,
    price: productData.price,
    desc: productData.desc || "",
    img: productData.image_url || productData.img || (productData.images && productData.images[0]) || ""
  } : null;

  if (!conv) {
    const initialData = {
      id: conversaId,
      participantes: [buyerId, final_seller_id],
      ultima_mensagem: "Conversa iniciada",
      data_ultima_atualizacao: new Date().toISOString(),
      nao_lidas: {
        [buyerId]: 0,
        [final_seller_id]: 0
      },
      nomes_participantes: {
        [buyerId]: buyerName,
        [final_seller_id]: finalSellerName
      },
      imagens_participantes: {
        [buyerId]: buyerAvatar,
        [final_seller_id]: finalSellerAvatar
      },
      produto: attachedProduct,
      criado_em: new Date().toISOString()
    };
    const { error: insertError } = await supabase.from('chats').insert(initialData);
    if (insertError) {
      console.error("Erro ao inserir nova conversa:", insertError);
      throw insertError;
    }
  } else {
    const updates: any = {};
    if (attachedProduct) {
      updates.produto = attachedProduct;
    }
    
    // Refresh participant info
    const nomes = conv.nomes_participantes || {};
    const imagens = conv.imagens_participantes || {};
    nomes[buyerId] = buyerName;
    nomes[final_seller_id] = finalSellerName;
    imagens[buyerId] = buyerAvatar;
    imagens[final_seller_id] = finalSellerAvatar;
    
    updates.nomes_participantes = nomes;
    updates.imagens_participantes = imagens;
    
    const { error: updateError } = await supabase.from('chats').update(updates).eq('id', conversaId);
    if (updateError) {
      console.error("Erro ao atualizar dados da conversa:", updateError);
    }
  }

  return conversaId;
}

function formatTimestamp(timestamp: any): string {
  if (!timestamp) return "agora";
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Ontem";
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

export function getConversationsListener(
  user_id: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participantes', [user_id]);

    if (error) {
      console.error("Erro completo ao buscar conversas (getConversationsListener):", error);
      return;
    }
    
    if (data) {
      const list = data.map((conv) => {
        const otherId = conv.participantes.find((id: string) => id !== user_id) || "";
        const otherName = conv.nomes_participantes?.[otherId] || "Vendedor";
        const otherAvatar = conv.imagens_participantes?.[otherId] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

        return {
          id: conv.id,
          participantes: conv.participantes || [],
          ultimaMensagem: conv.ultima_mensagem || "",
          dataUltimaAtualizacao: conv.data_ultima_atualizacao,
          naoLidas: conv.nao_lidas || {},
          unread: conv.nao_lidas?.[user_id] || 0,
          nomesParticipantes: conv.nomes_participantes || {},
          imagensParticipantes: conv.imagens_participantes || {},
          name: otherName,
          img: otherAvatar,
          product: conv.produto,
          time: formatTimestamp(conv.data_ultima_atualizacao)
        } as Conversation;
      });

      list.sort((a, b) => new Date(b.dataUltimaAtualizacao).getTime() - new Date(a.dataUltimaAtualizacao).getTime());
      callback(list);
    }
  };

  fetchConversations();

  const channel = supabase
    .channel('chats_listener')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'chats', 
      filter: `participantes=cs.{${user_id}}` 
    }, () => {
      fetchConversations();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function getMessagesListener(
  conversaId: string,
  callback: (messages: Message[]) => void
): () => void {
  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('data_envio', { ascending: true });

    if (error) {
      console.error("Erro ao buscar mensagens (Listener):", error);
      return;
    }

    if (data) {
      const messages = data.map((msg) => ({
        id: msg.id,
        senderId: msg.remetente_id,
        conversaId: msg.conversa_id,
        conteudo: msg.conteudo,
        text: msg.conteudo,
        tipo: msg.tipo || "texto",
        type: msg.tipo || "texto",
        dataEnvio: msg.data_envio,
        timestamp: msg.data_envio,
        status: msg.status || "enviada",
        sender: msg.remetente_id === user?.id ? "me" : "vendedor",
        time: formatTimestamp(msg.data_envio)
      })) as any[];
      callback(messages);
    }
  };

  fetchMessages();

  const channel = supabase
    .channel(`msgs_${conversaId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'mensagens', 
      filter: `conversa_id=eq.${conversaId}` 
    }, () => {
      fetchMessages();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function sendMessage(
  conversaId: string,
  senderId: string,
  content: string,
  type: "texto" | "imagem" | "audio" = "texto"
): Promise<void> {
  const { error: insertError } = await supabase.from('mensagens').insert({
    conversa_id: conversaId,
    remetente_id: senderId,
    conteudo: content,
    tipo: type,
    status: "enviada"
  });

  if (insertError) {
    console.error("Erro ao inserir mensagem:", insertError);
    throw insertError;
  }

  const { data: conv, error: fetchConvError } = await supabase.from('chats').select('*').eq('id', conversaId).single();
  
  if (fetchConvError) {
    console.error("Erro ao buscar chat após envio de mensagem:", fetchConvError);
    return;
  }
  
  if (conv) {
    const otherId = conv.participantes.find((id: string) => id !== senderId) || "";

    const updates: any = {
      ultima_mensagem: content,
      data_ultima_atualizacao: new Date().toISOString()
    };

    if (otherId) {
      const unread = conv.nao_lidas || {};
      unread[otherId] = (unread[otherId] || 0) + 1;
      updates.nao_lidas = unread;
    }

    const { error: updateChatError } = await supabase.from('chats').update(updates).eq('id', conversaId);
    if (updateChatError) {
      console.error("Erro ao atualizar última mensagem no chat:", updateChatError);
    }
    
    if (otherId && !otherId.startsWith("virtual_")) {
      triggerPushNotification(otherId, content);
    }
  }
}

export async function markAsRead(conversaId: string, user_id: string): Promise<void> {
  const { data: conv, error: fetchError } = await supabase.from('chats').select('*').eq('id', conversaId).single();
  
  if (fetchError) {
    console.error("Erro completo ao buscar conversa para marcar como lida:", fetchError);
    return;
  }

  if (conv) {
    const unread = conv.nao_lidas || {};
    if (unread[user_id] > 0) {
      unread[user_id] = 0;
      const { error: updateError } = await supabase.from('chats').update({ nao_lidas: unread }).eq('id', conversaId);
      if (updateError) {
        console.error("Erro ao zerar mensagens não lidas:", updateError);
      }
    }
  }

  const { error: markError } = await supabase.from('mensagens')
    .update({ status: 'lida' })
    .eq('conversa_id', conversaId)
    .neq('remetente_id', user_id)
    .neq('status', 'lida');
  
  if (markError) {
    console.error("Erro ao atualizar status das mensagens para lida:", markError);
  }
}

async function triggerPushNotification(user_id: string, text: string) {
  // Logic to simulate or trigger push
  console.log(`[PUSH] Para ${user_id}: ${text}`);
}

