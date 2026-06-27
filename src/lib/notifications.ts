import { supabase } from "./supabase";

export type NotificationType = "like" | "price" | "follow" | "system" | "comment" | "review";

export interface NotificationPayload {
  userId: string; // The user who should receive the notification
  type: NotificationType;
  title: string;
  description: string;
  productName?: string;
  productId?: string;
  senderId?: string; // The user who triggered the notification
}

export const sendNotification = async (payload: NotificationPayload) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      product_name: payload.productName || null,
      product_id: payload.productId || null,
      sender_id: payload.senderId || null,
      read: false
    });
    if (error) throw error;
  } catch (error) {
    console.error("Erro completo ao enviar notificação (Notifications):", error);
  }
};
