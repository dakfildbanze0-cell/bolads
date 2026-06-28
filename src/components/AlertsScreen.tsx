import React, { useState, useEffect } from "react";
import { Bell, Heart, Tag, UserPlus, Info, Check, MessageSquare, Star, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Alert {
  id: string;
  type: "like" | "price" | "follow" | "system" | "comment" | "review";
  title: string;
  description: string;
  time: string;
  read: boolean;
  productName?: string;
  created_at?: string;
}

interface AlertsScreenProps {
  onSelectProduct?: (product: any) => void;
  products?: any[];
  onBack?: () => void;
  currentUser?: any;
}

export default function AlertsScreen({ onSelectProduct, products = [], onBack, currentUser }: AlertsScreenProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<"todas" | "nao_lidas">("todas");

  useEffect(() => {
    if (!currentUser) return;

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro completo ao buscar notificações (Alerts):", error);
        return;
      }

      if (data) {
        const list = data.map((item: any) => {
          let timeString = "Agora mesmo";
          if (item.created_at) {
            const date = new Date(item.created_at);
            const diffMs = new Date().getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) {
              timeString = `Há ${diffMins} minutos`;
            } else if (diffMins < 1440) {
              timeString = `Há ${Math.floor(diffMins / 60)} horas`;
            } else {
              timeString = `Há ${Math.floor(diffMins / 1440)} dias`;
            }
          }
          return {
            ...item,
            productName: item.product_name,
            time: timeString
          };
        });
        setAlerts(list);
      }
    };

    fetchAlerts();

    const channel = supabase
      .channel(`notifications_${currentUser.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${currentUser.id}` 
      }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      
      // Auto-mark as read when leaving the screen
      if (currentUser) {
        supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', currentUser.id)
          .eq('read', false)
          .then(({ error }) => {
            if (error) console.error("Error auto-marking alerts as read", error);
          });
      }
    };
  }, [currentUser]);

  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      if (error) throw error;
    } catch (e) {
      console.error("Erro completo ao marcar todas as notificações como lidas:", e);
    }
  };

  const toggleRead = async (id: string, e: React.MouseEvent, currentRead: boolean) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: !currentRead })
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error("Erro completo ao alterar status de leitura da notificação:", err);
    }
  };

  const handleAlertClick = async (alert: Alert) => {
    // Marcar como lida ao clicar
    if (!alert.read) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', alert.id);
      } catch (err) {
        console.error("Erro ao marcar como lida:", err);
      }
    }

    if (alert.productName && onSelectProduct && products.length > 0) {
      const found = products.find(
        (p) => p.name.toLowerCase() === alert.productName?.toLowerCase()
      );
      if (found) {
        onSelectProduct(found);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-zinc-300 fill-zinc-300" />;
      case "price":
        return <Tag className="w-4 h-4 text-zinc-300" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-zinc-300" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-zinc-300" />;
      case "review":
        return <Star className="w-4 h-4 text-zinc-300 fill-zinc-300" />;
      default:
        return <Info className="w-4 h-4 text-zinc-300" />;
    }
  };

  const filteredAlerts = activeTab === "todas" ? alerts : alerts.filter((a) => !a.read);

  return (
    <div className="flex flex-col gap-[5px] w-full animate-fade-in text-white">
      {/* Header section - max 8px gap */}
      <section className="py-[12px] px-[5px] flex flex-col gap-[5px] sticky top-0 bg-zinc-900 z-10">
        <div className="flex items-center justify-between gap-[5px]">
          <div className="flex items-center gap-[6px]">
            {onBack && (
              <button onClick={onBack} className="mr-[4px] p-[2px] rounded-full hover:bg-zinc-800 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="relative">
              <Bell className="w-5 h-5 text-white" strokeWidth={3} />
              {alerts.some(a => !a.read) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-zinc-900" />
              )}
            </div>
            <h2 className="font-chivo text-[20px] md:text-[32px] font-extrabold leading-none text-white">
              Alertas
            </h2>
          </div>
          {alerts.some((a) => !a.read) && (
            <button
              onClick={markAllAsRead}
              className="text-[12px] text-zinc-400 hover:text-white transition-colors cursor-pointer font-hanken font-bold"
            >
              Marcar como lidas
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-[12px] mt-[4px] border-b border-zinc-800">
          <button 
            onClick={() => setActiveTab("todas")}
            className={`pb-[8px] font-hanken text-[13px] font-bold transition-colors border-b-2 ${activeTab === "todas" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setActiveTab("nao_lidas")}
            className={`pb-[8px] font-hanken text-[13px] font-bold transition-colors border-b-2 flex items-center gap-[4px] ${activeTab === "nao_lidas" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}
          >
            Não lidas
            {alerts.some(a => !a.read) && (
              <span className="bg-rose-500 text-white text-[9px] px-[4px] py-[1px] rounded-full min-w-[16px] text-center">
                {alerts.filter(a => !a.read).length}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Main notifications container with maximum 8px separation */}
      <div className="flex flex-col gap-[5px] w-full px-[5px]">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-[24px] text-center gap-[8px] rounded-[8px]">
            <Bell className="w-8 h-8 text-neutral-650" />
            <p className="font-hanken text-[13px] text-neutral-400">
              {activeTab === "todas" ? "Nenhum alerta recente por aqui." : "Você não tem notificações não lidas."}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => handleAlertClick(alert)}
              className={`flex items-start gap-[5px] p-[5px] rounded-[8px] transition-all relative ${
                alert.productName ? "cursor-pointer hover:bg-zinc-900/40" : ""
              } ${!alert.read ? "bg-zinc-900/10" : ""}`}
            >
              {/* Alert Indicator Dot */}
              <div className="flex items-start gap-[6px] shrink-0 pt-0.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    !alert.read ? "bg-rose-500" : "bg-transparent"
                  }`}
                />
                <div className="w-7 h-7 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800">
                  {getIcon(alert.type)}
                </div>
              </div>

              {/* Alert Message */}
              <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                <div className="flex items-baseline justify-between gap-[5px]">
                  <h4 className="font-chivo text-[13px] font-extrabold text-white leading-tight">
                    {alert.title}
                  </h4>
                  <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                    {alert.time}
                  </span>
                </div>
                <p className="font-hanken text-[12px] text-neutral-400 leading-tight">
                  {alert.description}
                </p>
                {alert.productName && (
                  <span className="font-hanken text-[10px] text-zinc-500 underline mt-[2px] inline-block">
                    Ver anúncio
                  </span>
                )}
              </div>

              {/* Mark single as read checkbox button */}
              <button
                onClick={(e) => toggleRead(alert.id, e, alert.read)}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-white"
                title={alert.read ? "Marcar como não lida" : "Marcar como lida"}
              >
                <Check className={`w-3.5 h-3.5 ${alert.read ? "opacity-100" : "opacity-30"}`} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
