import { supabase } from "./supabase";

export type NotificationType = "like" | "price" | "follow" | "system" | "comment" | "review";

export interface NotificationPayload {
  user_id: string; // The user who should receive the notification
  type: NotificationType;
  title: string;
  description: string;
  productName?: string;
  product_id?: string;
  senderId?: string; // The user who triggered the notification
}

export const sendNotification = async (payload: NotificationPayload) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      product_name: payload.productName || null,
      product_id: payload.product_id || null,
      sender_id: payload.senderId || null,
      read: false
    });
    if (error) throw error;
  } catch (error) {
    console.error("Erro completo ao enviar notificação (Notifications):", error);
  }
};

export const notifyFollowersNewProduct = async (sellerId: string, sellerName: string, product: any) => {
  try {
    if (!sellerId) return;
    let followersIds: string[] = [];

    // Tentar obter via tabela follows
    const { data: followsData, error: followsError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', sellerId);

    if (!followsError && followsData) {
      followersIds = followsData.map(f => f.follower_id);
    } else {
      // Fallback via tabela profiles (procura onde o JSON seguido_vendedores possui o sellerName)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, followed_sellers');

      if (!profilesError && profilesData) {
        followersIds = profilesData
          .filter(p => {
            const followed = p.followed_sellers || {};
            return followed[sellerName] === true || followed[sellerId] === true;
          })
          .map(p => p.id);
      }
    }

    // Remover duplicatas e filtrar o próprio vendedor (evita que siga a si mesmo ou envie notificação para si)
    followersIds = Array.from(new Set(followersIds)).filter(id => id !== sellerId);

    if (followersIds.length === 0) return;

    // Inserir as notificações para todos os seguidores em lote
    const inserts = followersIds.map(followerId => ({
      user_id: followerId,
      type: "system" as NotificationType,
      title: "Novo anúncio publicado",
      description: `${sellerName} publicou um novo produto: ${product.name}.`,
      product_name: product.name,
      product_id: product.id,
      sender_id: sellerId,
      read: false
    }));

    const { error: insertError } = await supabase.from('notifications').insert(inserts);
    if (insertError) throw insertError;

  } catch (error) {
    console.error("Erro ao notificar seguidores sobre novo anúncio:", error);
  }
};

