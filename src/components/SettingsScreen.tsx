import { useState, useEffect } from "react";
import {
  User,
  Shield,
  HelpCircle,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Camera,
  Smartphone,
  Bell,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  Palette,
  Trash2,
  CheckCircle,
  Ban,
  Download,
  Volume2,
  RefreshCw,
  Send,
  UserCheck,
  X
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { uploadImage } from "../lib/supabase";

interface SettingsScreenProps {
  onBack?: () => void;
  initialSubView?: string | null;
  userProfile?: any;
  user?: any;
  onNavigate?: (screenName: string) => void;
  onProfileUpdate?: (updatedProfile: any) => void;
}

interface SettingsState {
  fullName: string;
  username: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: string;
  city: string;
  province: string;
  avatar: string;
  bio: string;
  coverImage: string;
  twoFactor: boolean;
  pinCode: string;
  sessions: { id: string; device: string; lastActive: string }[];
  profileVisibility: string;
  messagesVisibility: string;
  phoneVisibility: string;
  adsVisibility: string;
  blockedUsers: string[];
  notifyMessages: boolean;
  notifyFollowers: boolean;
  notifyReviews: boolean;
  notifySales: boolean;
  notifyPurchases: boolean;
  notifyPromotions: boolean;
  notifySystem: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showOnline: boolean;
  showLastSeen: boolean;
  readConfirmation: boolean;
  autoRenew: boolean;
  autoHighlight: boolean;
  pausedAds: string[];
  activeAds: string[];
  themeMode: string;
  fontSizeMenu: string;
  language: string;
  cacheSize: string;
  dataSaving: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  fullName: "Usuário",
  username: "usuario",
  phone: "N/A",
  email: "usuario@boladas.co.mz",
  birthDate: "1995-08-12",
  gender: "Não especificado",
  city: "Cidade",
  province: "Província",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
  bio: "Comprador e vendedor activo no portal boladas",
  coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  twoFactor: true,
  pinCode: "1408",
  sessions: [
    { id: "s1", device: "Telemóvel iphone maptuo", lastActive: "Activo agora" },
    { id: "s2", device: "Computador macbook maputo", lastActive: "Ontem às dezoito" }
  ],
  profileVisibility: "todos",
  messagesVisibility: "todos",
  phoneVisibility: "seguidores",
  adsVisibility: "todos",
  blockedUsers: ["Bruno chvale", "Carla sitoe"],
  notifyMessages: true,
  notifyFollowers: true,
  notifyReviews: true,
  notifySales: true,
  notifyPurchases: true,
  notifyPromotions: false,
  notifySystem: true,
  soundEnabled: true,
  vibrationEnabled: true,
  showOnline: true,
  showLastSeen: true,
  readConfirmation: true,
  autoRenew: true,
  autoHighlight: false,
  pausedAds: ["Iphone onze em bom estado", "Teclado mecânico gamer"],
  activeAds: ["Macbook dmitry seminovo", "Suporte articulado de mesa"],
  themeMode: "escuro",
  fontSizeMenu: "grande",
  language: "Português",
  cacheSize: "14.2 mb",
  dataSaving: false
};

export default function SettingsScreen({ onBack, initialSubView = null, userProfile, user, onNavigate, onProfileUpdate }: SettingsScreenProps) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem("boladas_settings");
    let state = DEFAULT_SETTINGS;
    if (saved) {
      try {
        state = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    
    // Inject real profile data if provided
    if (userProfile) {
      state = {
        ...state,
        fullName: userProfile.name || state.fullName,
        avatar: userProfile.avatar_url || userProfile.avatar || state.avatar,
        email: user?.email || state.email
      };
    }
    return state;
  });

  const [currentSubView, setCurrentSubView] = useState<string | null>(initialSubView);

  useEffect(() => {
    setCurrentSubView(initialSubView);
  }, [initialSubView]);
  const [toast, setToast] = useState<string | null>(null);
  const [tempBlockUser, setTempBlockUser] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Telemóvel Android";
    if (/iPad|iPhone|iPod/.test(ua)) return "Telemóvel iPhone";
    if (/Macintosh/i.test(ua)) return "Computador MacBook";
    if (/Windows/i.test(ua)) return "Computador Windows PC";
    if (/Linux/i.test(ua)) return "Computador Linux PC";
    return "Navegador web";
  };

  const verifyPIN = (actionDescription: string): boolean => {
    if (!settings.pinCode) {
      return true;
    }
    const entered = prompt(`Por favor, introduza o seu PIN de segurança actual de 4 dígitos para autorizar:\n${actionDescription}`);
    if (entered === settings.pinCode) {
      return true;
    }
    if (entered === null) {
      return false;
    }
    showToast("PIN de segurança incorrecto! Operação cancelada");
    return false;
  };

  useEffect(() => {
    const currentDeviceName = getDeviceName();
    const hasCurrent = settings.sessions.some(s => s.id === "s1" && s.device === currentDeviceName);
    if (!hasCurrent) {
      const updatedSessions = settings.sessions.map(s => 
        s.id === "s1" ? { ...s, device: currentDeviceName } : s
      );
      if (!settings.sessions.some(s => s.id === "s1")) {
        updatedSessions.unshift({ id: "s1", device: currentDeviceName, lastActive: "Activo agora" });
      }
      setSettings(prev => ({ ...prev, sessions: updatedSessions }));
    }
  }, [settings.sessions]);

  useEffect(() => {
    if (!user) return;

    const loadDefinicoes = async () => {
      try {
        const { data, error } = await supabase
          .from('definicoes')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao carregar da tabela definicoes:", error);
          return;
        }

        if (data) {
          const dbSettings = data.settings || {};
          setSettings((prev) => ({
            ...prev,
            ...dbSettings,
            themeMode: data.theme_mode || dbSettings.themeMode || prev.themeMode,
            fontSizeMenu: data.font_size || dbSettings.fontSizeMenu || prev.fontSizeMenu,
            language: data.language || dbSettings.language || prev.language,
            notifyMessages: data.notifications_enabled !== undefined ? data.notifications_enabled : (dbSettings.notifyMessages !== undefined ? dbSettings.notifyMessages : prev.notifyMessages),
            soundEnabled: data.sound_enabled !== undefined ? data.sound_enabled : (dbSettings.soundEnabled !== undefined ? dbSettings.soundEnabled : prev.soundEnabled),
            vibrationEnabled: data.vibration_enabled !== undefined ? data.vibration_enabled : (dbSettings.vibrationEnabled !== undefined ? dbSettings.vibrationEnabled : prev.vibrationEnabled),
            showOnline: data.show_online !== undefined ? data.show_online : (dbSettings.showOnline !== undefined ? dbSettings.showOnline : prev.showOnline),
            showLastSeen: data.show_last_seen !== undefined ? data.show_last_seen : (dbSettings.showLastSeen !== undefined ? dbSettings.showLastSeen : prev.showLastSeen),
            readConfirmation: data.read_confirmation !== undefined ? data.read_confirmation : (dbSettings.readConfirmation !== undefined ? dbSettings.readConfirmation : prev.readConfirmation),
            autoRenew: data.auto_renew !== undefined ? data.auto_renew : (dbSettings.autoRenew !== undefined ? dbSettings.autoRenew : prev.autoRenew),
            autoHighlight: data.auto_highlight !== undefined ? data.auto_highlight : (dbSettings.autoHighlight !== undefined ? dbSettings.autoHighlight : prev.autoHighlight),
            twoFactor: data.two_factor !== undefined ? data.two_factor : (dbSettings.twoFactor !== undefined ? dbSettings.twoFactor : prev.twoFactor),
            pinCode: data.pin_code || dbSettings.pinCode || prev.pinCode,
            profileVisibility: data.profile_visibility || dbSettings.profileVisibility || prev.profileVisibility,
            messagesVisibility: data.messages_visibility || dbSettings.messagesVisibility || prev.messagesVisibility,
            phoneVisibility: data.phone_visibility || dbSettings.phoneVisibility || prev.phoneVisibility,
            blockedUsers: data.blocked_users || dbSettings.blockedUsers || prev.blockedUsers,
            sessions: data.sessions || dbSettings.sessions || prev.sessions,
          }));
        } else {
          const initialRecord = {
            user_id: user.id,
            theme_mode: settings.themeMode,
            font_size: settings.fontSizeMenu,
            language: settings.language,
            notifications_enabled: settings.notifyMessages,
            sound_enabled: settings.soundEnabled,
            vibration_enabled: settings.vibrationEnabled,
            show_online: settings.showOnline,
            show_last_seen: settings.showLastSeen,
            read_confirmation: settings.readConfirmation,
            auto_renew: settings.autoRenew,
            auto_highlight: settings.autoHighlight,
            two_factor: settings.twoFactor,
            pin_code: settings.pinCode,
            profile_visibility: settings.profileVisibility,
            messages_visibility: settings.messagesVisibility,
            phone_visibility: settings.phoneVisibility,
            blocked_users: settings.blockedUsers,
            sessions: settings.sessions,
            settings: settings,
          };
          await supabase.from('definicoes').insert(initialRecord);
        }
      } catch (err) {
        console.error("Erro geral ao carregar da tabela definicoes:", err);
      }
    };

    loadDefinicoes();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("boladas_settings", JSON.stringify(settings));
    if (user) {
      const syncTimeout = setTimeout(() => {
        const payload = {
          theme_mode: settings.themeMode,
          font_size: settings.fontSizeMenu,
          language: settings.language,
          notifications_enabled: settings.notifyMessages,
          sound_enabled: settings.soundEnabled,
          vibration_enabled: settings.vibrationEnabled,
          show_online: settings.showOnline,
          show_last_seen: settings.showLastSeen,
          read_confirmation: settings.readConfirmation,
          auto_renew: settings.autoRenew,
          auto_highlight: settings.autoHighlight,
          two_factor: settings.twoFactor,
          pin_code: settings.pinCode,
          profile_visibility: settings.profileVisibility,
          messages_visibility: settings.messagesVisibility,
          phone_visibility: settings.phoneVisibility,
          blocked_users: settings.blockedUsers,
          sessions: settings.sessions,
          settings: settings,
          updated_at: new Date().toISOString()
        };

        // Sync fully to definicoes table
        supabase
          .from('definicoes')
          .upsert({ user_id: user.id, ...payload }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) {
              console.error("Erro ao sincronizar definições na tabela definicoes:", error);
            } else {
              // Also sync profiles for complete consistency
              supabase
                .from('profiles')
                .update({ settings })
                .eq('id', user.id)
                .then(({ error: profileError }) => {
                  if (profileError) console.error("Erro ao sincronizar definições no perfil:", profileError);
                });
            }
          });
      }, 1000);
      return () => clearTimeout(syncTimeout);
    }
  }, [settings, user]);

  useEffect(() => {
    if (userProfile) {
      setSettings(prev => ({ 
        ...prev, 
        ...(userProfile.settings || {}), 
        fullName: userProfile.name || prev.fullName, 
        avatar: userProfile.avatar_url || userProfile.avatar || prev.avatar 
      }));
    }
  }, [userProfile]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const updateSetting = (key: keyof SettingsState, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    showToast("Alterações guardadas com sucesso");
  };

  return (
    <div className="flex flex-col gap-[8px] p-[8px] w-full text-white bg-black min-h-screen">
      
      {toast && (
        <div className="fixed bottom-[8px] left-[8px] right-[8px] bg-white text-black p-[8px] rounded-[8px] flex items-center gap-[8px] z-50 text-[16px] font-normal">
          <CheckCircle className="w-6 h-6 shrink-0 text-black" strokeWidth={3.5} />
          <span>{toast}</span>
        </div>
      )}

      {currentSubView === null ? (
        <div className="flex flex-col gap-[8px]">
          
          <div className="flex items-center justify-between p-[8px] bg-zinc-900 rounded-[8px]">
            <div className="flex items-center gap-[8px]">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-[4px] text-white hover:opacity-80 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center shrink-0 active:scale-95"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-6 h-6 text-white" strokeWidth={3.5} />
                </button>
              )}
              <div className="flex flex-col gap-[2px]">
                <h2 className="text-[26px] font-normal tracking-tight text-white leading-none">
                  Definições da conta
                </h2>
                <span className="text-[14px] text-zinc-400 leading-none">
                  Gerencie informações e preferências da sua conta
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <div className="px-[8px]">
              <span className="text-[14px] font-normal text-zinc-400 tracking-wider">
                Acesso e configurações de perfil
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-[8px]">
              <button
                onClick={() => setCurrentSubView("profile")}
                className="flex items-center justify-between p-[8px] bg-zinc-900 hover:bg-zinc-800 rounded-[8px] text-left transition-all bg-transparent border-none cursor-pointer"
              >
                <div className="flex items-center gap-[8px]">
                  <img src={settings.avatar} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[18px] font-normal text-white">
                      Informações pessoais
                    </span>
                    <span className="text-[14px] text-zinc-400">
                      Nome, telefone, email e biografia pública
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-zinc-450" strokeWidth={3.5} />
              </button>

              <button
                onClick={() => setCurrentSubView("security")}
                className="flex items-center justify-between p-[8px] bg-zinc-900 hover:bg-zinc-800 rounded-[8px] text-left transition-all bg-transparent border-none cursor-pointer"
              >
                <div className="flex items-center gap-[8px]">
                  <div className="w-12 h-12 rounded-[8px] bg-zinc-800 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-white" strokeWidth={3.5} />
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[18px] font-normal text-white">
                      Segurança e privacidade
                    </span>
                    <span className="text-[14px] text-zinc-400">
                      Duas etapas, visibilidade e bloqueios
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-zinc-450" strokeWidth={3.5} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
            <span className="text-[14px] font-normal text-zinc-400 tracking-wider px-[8px]">
              Ações críticas da conta
            </span>
            <div className="flex flex-col gap-[4px]">
              {!confirmSignOut ? (
                <button 
                  onClick={() => setConfirmSignOut(true)}
                  className="w-full text-left p-[8px] bg-zinc-800 hover:bg-zinc-700 text-neutral-200 rounded-[6px] flex items-center justify-between transition-all border-none cursor-pointer"
                >
                  <span className="text-[16px] font-normal">
                    Sair do aplicativo
                  </span>
                  <LogOut className="w-6 h-6 text-white" strokeWidth={3.5} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        await supabase.auth.signOut();
                        showToast("Sessão encerrada com sucesso");
                        if (onBack) onBack();
                      } catch (e) {
                        console.error("Erro ao sair:", e);
                      }
                      setConfirmSignOut(false);
                    }}
                    className="flex-1 p-[8px] bg-white text-black font-bold rounded-[6px] border-none cursor-pointer"
                  >
                    Confirmar Saída
                  </button>
                  <button 
                    onClick={() => setConfirmSignOut(false)}
                    className="flex-1 p-[8px] bg-zinc-800 text-white rounded-[6px] border-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {!confirmDeactivate ? (
                <button 
                  onClick={() => setConfirmDeactivate(true)}
                  className="w-full text-left p-[8px] bg-zinc-800 hover:bg-zinc-700 text-neutral-250 rounded-[6px] flex items-center justify-between transition-all border-none cursor-pointer"
                >
                  <span className="text-[16px] font-normal">
                    Desativar conta temporariamente
                  </span>
                  <Ban className="w-6 h-6 text-white" strokeWidth={3.5} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        await supabase.auth.signOut();
                        showToast("Sua conta foi desativada temporariamente");
                        if (onBack) onBack();
                      } catch (e) {}
                      setConfirmDeactivate(false);
                    }}
                    className="flex-1 p-[8px] bg-white text-black font-bold rounded-[6px] border-none cursor-pointer"
                  >
                    Confirmar Desativação
                  </button>
                  <button 
                    onClick={() => setConfirmDeactivate(false)}
                    className="flex-1 p-[8px] bg-zinc-800 text-white rounded-[6px] border-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {!confirmDelete ? (
                <button 
                  onClick={() => setConfirmDelete(true)}
                  className="w-full text-left p-[8px] bg-zinc-800 hover:bg-zinc-750 text-white rounded-[6px] flex items-center justify-between transition-all border-none cursor-pointer"
                >
                  <span className="text-[16px] font-normal">
                    Excluir conta permanentemente
                  </span>
                  <Trash2 className="w-6 h-6 text-white" strokeWidth={3.5} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      if (user) {
                        try {
                          // Supabase client doesn't support direct user deletion easily
                          // We usually just sign out and show a message
                          await supabase.auth.signOut();
                          showToast("Pedido de exclusão enviado (Sessão encerrada)");
                          if (onBack) onBack();
                        } catch (e) {
                          showToast("Erro ao processar exclusão");
                          await supabase.auth.signOut();
                          if (onBack) onBack();
                        }
                      }
                      setConfirmDelete(false);
                    }}
                    className="flex-1 p-[8px] bg-red-600 text-white font-bold rounded-[6px] border-none cursor-pointer"
                  >
                    Excluir Agora
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 p-[8px] bg-zinc-800 text-white rounded-[6px] border-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center mt-[4px] opacity-40 text-center leading-tight gap-[4px]">
            <span className="text-[14px] font-normal text-white">
              Aplicativo boladas versão corporativa
            </span>
            <span className="text-[12px] text-white">
              Ambiente de alto desempenho em maputo
            </span>
          </div>

        </div>
      ) : (
        <div className="flex flex-col gap-[8px]">
          
          <div className="flex items-center gap-[8px] p-[8px] bg-zinc-900 rounded-[8px]">
            <button
              onClick={() => {
                setCurrentSubView(null);
              }}
              className="p-[4px] text-white hover:opacity-80 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center shrink-0 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-white" strokeWidth={3.5} />
            </button>
            <div className="flex flex-col gap-[2px]">
              <h2 className="text-[20px] font-normal tracking-tight text-white leading-none">
                {currentSubView === "profile" && "Informações pessoais e biografia"}
                {currentSubView === "security" && "Segurança e privacidade"}
                {currentSubView === "notifications" && "Notificações e sons"}
                {currentSubView === "chat" && "Configurações de conversas"}
                {currentSubView === "inventory" && "Gestão e histórico comercial"}
                {currentSubView === "ads" && "Configurações de anúncios"}
                {currentSubView === "appearance" && "Aparência e sistema"}
                {currentSubView === "help" && "Suporte técnico e perguntas frequentes"}
              </h2>
            </div>
          </div>

          {currentSubView === "profile" && (
            <div className="flex flex-col gap-[8px]">
              <div className="relative h-[80px] rounded-[8px] overflow-hidden bg-zinc-900">
                <img src={settings.coverImage} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <button 
                  onClick={() => {
                    const newCover = prompt("Insira a nova imagem de capa");
                    if (newCover) updateSetting("coverImage", newCover);
                  }}
                  className="absolute right-[8px] bottom-[8px] bg-black/80 p-[6px] rounded-full text-white cursor-pointer hover:bg-zinc-900 transition-all text-[12px] flex items-center gap-1 border-none"
                >
                  <Camera className="w-4 h-4" />
                  <span>Mudar capa</span>
                </button>
              </div>

              <div className="flex gap-[8px] items-center p-[8px] bg-zinc-900 rounded-[8px]">
                <div className="relative">
                  <img src={settings.avatar} className="w-16 h-16 rounded-full object-cover" />
                  <button 
                    onClick={() => {
                      const newAvatar = prompt("Insira a nova foto de perfil");
                      if (newAvatar) updateSetting("avatar", newAvatar);
                    }}
                    className="absolute -bottom-1 -right-1 bg-white text-black rounded-full p-[4px] border-none cursor-pointer font-normal"
                  >
                    <Camera className="w-4 h-4 text-black" />
                  </button>
                </div>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[16px] font-normal text-white">Fotografia de perfil</span>
                  <span className="text-[14px] text-zinc-400">Tamanho quadrado recomendado de duzentos píxels</span>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <div className="flex flex-col gap-[4px]">
                  <label className="text-[14px] text-zinc-400 font-normal ml-1">Nome completo</label>
                  <input
                    type="text"
                    value={settings.fullName}
                    onChange={(e) => updateSetting("fullName", e.target.value)}
                    className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none border-none"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label className="text-[14px] text-zinc-400 font-normal ml-1">Nome de usuário</label>
                  <input
                    type="text"
                    value={settings.username}
                    onChange={(e) => updateSetting("username", e.target.value)}
                    className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none border-none"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label className="text-[14px] text-zinc-400 font-normal ml-1">Telefone de contacto</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => updateSetting("phone", e.target.value)}
                    className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none border-none"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label className="text-[14px] text-zinc-400 font-normal ml-1">Email profissional</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting("email", e.target.value)}
                    className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none border-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-[8px]">
                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[14px] text-zinc-400 font-normal ml-1">Data de nascimento</label>
                    <input
                      type="date"
                      value={settings.birthDate}
                      onChange={(e) => updateSetting("birthDate", e.target.value)}
                      className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none border-none"
                    />
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[14px] text-zinc-400 font-normal ml-1">Género</label>
                    <select
                      value={settings.gender}
                      onChange={(e) => updateSetting("gender", e.target.value)}
                      className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none border-none"
                    >
                      <option>Masculino</option>
                      <option>Feminino</option>
                      <option>Outro</option>
                      <option>Prefiro não dizer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-[8px]">
                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[14px] text-zinc-400 font-normal ml-1">Cidade</label>
                    <input
                      type="text"
                      value={settings.city}
                      onChange={(e) => updateSetting("city", e.target.value)}
                      className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none border-none"
                    />
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[14px] text-zinc-400 font-normal ml-1">Província</label>
                    <input
                      type="text"
                      value={settings.province}
                      onChange={(e) => updateSetting("province", e.target.value)}
                      className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none border-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <div className="flex flex-col gap-[4px]">
                  <label className="text-[14px] text-zinc-400 font-normal ml-1">Editar biografia pública</label>
                  <textarea
                    rows={3}
                    value={settings.bio}
                    onChange={(e) => updateSetting("bio", e.target.value)}
                    className="p-[8px] bg-zinc-800 text-white rounded-[6px] text-[16px] focus:outline-none resize-none border-none"
                  />
                </div>

                <div className="flex flex-col p-[8px] bg-zinc-850 rounded-[6px] gap-[4px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-normal text-white">Link do seu perfil público</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://boladas.co.mz/u/${settings.username}`);
                        showToast("Link copiado para a Área de transferência");
                      }}
                      className="text-[14px] text-white bg-transparent border-none font-normal cursor-pointer hover:underline"
                    >
                      Copiar link
                    </button>
                  </div>
                  <span className="text-[14px] text-zinc-400 break-all select-all font-mono">
                    https://boladas.co.mz/u/{settings.username}
                  </span>
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (user) {
                    try {
                      let finalAvatar = settings.avatar;

                      // If avatar is base64, upload to Supabase
                      if (settings.avatar && settings.avatar.startsWith("data:image")) {
                        try {
                          finalAvatar = await uploadImage(settings.avatar, 'images', `profiles/${user.id}`);
                        } catch (uploadErr: any) {
                          console.error("Erro no upload da imagem de perfil:", uploadErr);
                          if (uploadErr.message?.includes("bucket")) {
                            alert(uploadErr.message);
                            return;
                          }
                        }
                      }

                      const { error } = await supabase
                        .from('profiles')
                        .update({
                          name: settings.fullName,
                          avatar_url: finalAvatar,
                          phone: settings.phone,
                          location: `${settings.city}, ${settings.province}`,
                          bio: settings.bio
                        })
                        .eq('id', user.id);

                      if (error) throw error;
                      if (onProfileUpdate) {
                        onProfileUpdate({
                          name: settings.fullName,
                          avatar_url: finalAvatar,
                          phone: settings.phone,
                          location: `${settings.city}, ${settings.province}`,
                          bio: settings.bio
                        });
                      }
                      showToast("Perfil atualizado no banco de dados com sucesso");
                    } catch (err) {
                      console.error("Erro ao sincronizar perfil:", err);
                      showToast("Erro ao sincronizar o perfil com o banco");
                    }
                  } else {
                    showToast("Perfil sincronizado localmente com sucesso");
                  }
                }}
                className="w-full bg-white text-black font-normal p-[10px] rounded-[8px] border-none text-[16px] cursor-pointer flex items-center justify-center gap-[8px]"
              >
                <UserCheck className="w-6 h-6 text-black" strokeWidth={3} />
                <span>Guardar alterações do perfil</span>
              </button>
            </div>
          )}

          {currentSubView === "security" && (
            <div className="flex flex-col gap-[8px]">
              
              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white px-1">
                  Login e credenciais
                </span>
                
                <div className="flex flex-col gap-[8px]">
                  <button 
                    onClick={async () => {
                      if (!verifyPIN("Alterar senha técnica")) return;
                      const newPass = prompt("Insira a nova senha segura (mínimo de 6 caracteres)");
                      if (newPass) {
                        if (newPass.length < 6) {
                          showToast("A nova senha deve ter pelo menos 6 caracteres");
                          return;
                        }
                        try {
                          const { error } = await supabase.auth.updateUser({ password: newPass });
                          if (error) {
                            showToast("Erro ao alterar a senha: " + error.message);
                          } else {
                            showToast("Senha técnica alterada com sucesso");
                          }
                        } catch (err) {
                          showToast("Erro ao atualizar a senha");
                        }
                      }
                    }}
                    className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px] text-left bg-transparent border-none cursor-pointer"
                  >
                    <span className="text-[16px] text-white font-normal">Alterar senha técnica</span>
                    <ChevronRight className="w-6 h-6 text-zinc-400" strokeWidth={3} />
                  </button>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[16px] text-white font-normal">Autenticação de dois fatores</span>
                      <span className="text-[14px] text-zinc-400">Proteção adicional contra acessos indesejados</span>
                    </div>
                    <div
                      onClick={() => {
                        if (!verifyPIN("Alterar autenticação de dois fatores")) return;
                        updateSetting("twoFactor", !settings.twoFactor);
                        showToast("Autenticação de dois fatores actualizada");
                      }}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.twoFactor ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.twoFactor ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[16px] text-white font-normal">PIN de segurança</span>
                      <span className="text-[14px] text-zinc-400">PIN de segurança actual: <strong className="text-white">{settings.pinCode}</strong></span>
                    </div>
                    <button 
                      onClick={() => {
                        if (!verifyPIN("Alterar PIN de segurança")) return;
                        const newPin = prompt("Defina um novo PIN de quatro dígitos", settings.pinCode);
                        if (newPin) {
                          if (newPin.length === 4 && !isNaN(Number(newPin))) {
                            updateSetting("pinCode", newPin);
                            showToast("PIN de segurança actualizado com sucesso");
                          } else {
                            showToast("PIN inválido! Deve conter exactamente 4 dígitos numéricos");
                          }
                        }
                      }}
                      className="bg-transparent border-none font-normal text-[14px] px-[8px] py-[4px] rounded-[4px] text-white cursor-pointer hover:bg-neutral-700"
                    >
                      Editar PIN
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white px-1">
                  Definições de visibilidade
                </span>

                <div className="flex flex-col gap-[8px]">
                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <span className="text-[16px] text-neutral-300 font-normal">Quem vê meu perfil</span>
                    <select
                      value={settings.profileVisibility}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!verifyPIN("Alterar visibilidade do perfil")) return;
                        updateSetting("profileVisibility", val);
                        showToast("Visibilidade do perfil actualizada");
                      }}
                      className="bg-zinc-950 text-white rounded p-1 text-[14px] border-none focus:outline-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="seguidores">Seguidores</option>
                      <option value="ninguem">Ninguém</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <span className="text-[16px] text-neutral-300 font-normal">Quem pode enviar mensagens</span>
                    <select
                      value={settings.messagesVisibility}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!verifyPIN("Alterar quem pode enviar mensagens")) return;
                        updateSetting("messagesVisibility", val);
                        showToast("Definições de mensagens actualizada");
                      }}
                      className="bg-zinc-950 text-white rounded p-1 text-[14px] border-none focus:outline-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="seguidores">Apenas seguidores</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <span className="text-[16px] text-neutral-300 font-normal">Quem vê meu contacto</span>
                    <select
                      value={settings.phoneVisibility}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!verifyPIN("Alterar visibilidade do contacto")) return;
                        updateSetting("phoneVisibility", val);
                        showToast("Visibilidade do contacto actualizada");
                      }}
                      className="bg-zinc-950 text-white rounded p-1 text-[14px] border-none focus:outline-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="seguidores">Seguidores</option>
                      <option value="ninguem">Ninguém</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white px-1">
                  Utilizadores bloqueados
                </span>

                <div className="flex gap-[8px] p-1 items-center">
                  <input
                    type="text"
                    placeholder="Nome do integrante para bloquear"
                    value={tempBlockUser}
                    onChange={(e) => setTempBlockUser(e.target.value)}
                    className="flex-1 p-[8px] bg-zinc-800 rounded-[6px] text-[16px] text-white focus:outline-none border-none"
                  />
                  <button 
                    onClick={() => {
                      if (!tempBlockUser.trim()) return;
                      const targetUser = tempBlockUser.trim();
                      if (!verifyPIN(`Confirmar o bloqueio de ${targetUser}`)) return;
                      const updated = [...settings.blockedUsers, targetUser];
                      updateSetting("blockedUsers", updated);
                      setTempBlockUser("");
                      showToast("Utilizador adicionado à lista de bloqueio");
                    }}
                    className="bg-white text-black px-[12px] py-[8px] font-normal rounded-[6px] border-none text-[14px] cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Bloquear
                  </button>
                </div>

                {settings.blockedUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-[8px] px-1 pb-1">
                    {settings.blockedUsers.map((blockedUser) => (
                      <div key={blockedUser} className="flex items-center gap-[4px] bg-zinc-800 px-[8px] py-[4px] rounded-full text-[14px] text-zinc-300">
                        <span>{blockedUser}</span>
                        <button 
                          onClick={() => {
                            if (!verifyPIN(`Confirmar o desbloqueio de ${blockedUser}`)) return;
                            const filtered = settings.blockedUsers.filter(u => u !== blockedUser);
                            updateSetting("blockedUsers", filtered);
                            showToast("Utilizador desbloqueado com sucesso");
                          }}
                          className="text-white bg-transparent border-none font-normal text-[16px] cursor-pointer ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[14px] text-zinc-500 px-2 italic">Nenhum utilizador bloqueado atualmente</span>
                )}
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[14px] font-normal text-white">
                    Dispositivos conectados
                  </span>
                  <button 
                    onClick={() => {
                      if (!verifyPIN("Encerrar todas as outras sessões activas")) return;
                      updateSetting("sessions", [
                        { id: "s1", device: getDeviceName(), lastActive: "Activo agora" }
                      ]);
                      showToast("Outras sessões encerradas com sucesso");
                    }}
                    className="text-[12px] text-white hover:underline bg-transparent border-none cursor-pointer font-normal"
                  >
                    Encerrar nos outros dispositivos
                  </button>
                </div>

                <div className="flex flex-col gap-[8px]">
                  {settings.sessions.map((sess) => (
                    <div key={sess.id} className="flex justify-between items-center bg-zinc-800 p-[8px] rounded-[6px]">
                      <div className="flex items-center gap-[8px]">
                        <Smartphone className="w-6 h-6 text-white" strokeWidth={3} />
                        <div className="flex flex-col gap-[2px]">
                          <span className="text-[16px] text-white font-normal">{sess.device}</span>
                          <span className="text-[12px] text-zinc-400">{sess.lastActive}</span>
                        </div>
                      </div>
                      {sess.id !== "s1" && (
                        <button 
                          onClick={() => {
                            if (!verifyPIN(`Encerrar a sessão no dispositivo ${sess.device}`)) return;
                            const filtered = settings.sessions.filter(s => s.id !== sess.id);
                            updateSetting("sessions", filtered);
                            showToast("Sessão desativada com sucesso");
                          }}
                          className="p-1 text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-6 h-6" strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-[4px] p-[8px] bg-zinc-900 rounded-[8px] text-center items-center justify-center">
                <span className="text-[14px] font-normal text-zinc-300">Precisa exportar seus dados de uso</span>
                <button 
                  onClick={() => {
                    try {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", "boladas_dados_cadastrados.json");
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showToast("Exportação concluída com sucesso");
                    } catch (err) {
                      console.error("Erro ao exportar dados:", err);
                      showToast("Erro ao exportar dados");
                    }
                  }}
                  className="bg-zinc-800 border-none text-white font-normal text-[14px] px-[12px] py-[6px] rounded-[6px] cursor-pointer hover:bg-zinc-700 flex items-center gap-[8px]"
                >
                  <Download className="w-6 h-6" strokeWidth={3} />
                  <span>Baixar cópia de dados cadastrados</span>
                </button>
              </div>

            </div>
          )}

          {currentSubView === "notifications" && (
            <div className="flex flex-col gap-[8px]">
              
              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Atividade do aplicativo
                </span>

                <div className="flex flex-col gap-[8px]">
                  {[
                    { id: "notifyMessages", title: "Mensagens recebidas", desc: "Alertas para conversas pendentes no chat" },
                    { id: "notifyFollowers", title: "Novos seguidores", desc: "Saber quando alguém começar a lhe seguir" },
                    { id: "notifyReviews", title: "Novas avaliações", desc: "Avisos de novas estrelas e feedbacks recebidos" },
                    { id: "notifySales", title: "Actualizações de vendas", desc: "Informações sobre novos lances ou propostas de comprador" },
                    { id: "notifyPurchases", title: "Estado de compras", desc: "Avisos sobre envio ou aceitação de propostas" },
                    { id: "notifyPromotions", title: "Promoções e destaques", desc: "Descontos especiais e eventos de marketing" },
                    { id: "notifySystem", title: "Melhorias de infraestrutura", desc: "Informações de atualização de segurança" },
                  ].map((notif) => (
                    <div key={notif.id} className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                      <div className="flex flex-col pr-2 gap-[2px]">
                        <span className="text-[16px] text-white font-normal">{notif.title}</span>
                        <span className="text-[14px] text-zinc-400">{notif.desc}</span>
                      </div>
                      <div
                        onClick={() => updateSetting(notif.id as any, !(settings as any)[notif.id])}
                        className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                      >
                        <div
                          className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                            (settings as any)[notif.id] ? "bg-white" : "bg-neutral-700"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                              (settings as any)[notif.id] ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Som e vibração
                </span>

                <div className="flex flex-col gap-[8px]">
                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex items-center gap-[8px]">
                      <Volume2 className="w-6 h-6 text-white" strokeWidth={3} />
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[16px] text-white font-normal">Sons de alerta</span>
                        <span className="text-[14px] text-zinc-400">Ativa notificações sonoras no app</span>
                      </div>
                    </div>
                    <div
                      onClick={() => updateSetting("soundEnabled", !settings.soundEnabled)}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.soundEnabled ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.soundEnabled ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[16px] text-white font-normal">Vibrar dispositivo</span>
                      <span className="text-[14px] text-zinc-400">Vibra nas acções críticas e fechamento de vendas</span>
                    </div>
                    <div
                      onClick={() => updateSetting("vibrationEnabled", !settings.vibrationEnabled)}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.vibrationEnabled ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.vibrationEnabled ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {currentSubView === "chat" && (
            <div className="flex flex-col gap-[8px]">
              
              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Privacidade de conversas
                </span>

                <div className="flex flex-col gap-[8px]">
                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[16px] text-white font-normal">Mostrar status online</span>
                      <span className="text-[14px] text-zinc-400">Outros membros podem lhe ver activo</span>
                    </div>
                    <div
                      onClick={() => updateSetting("showOnline", !settings.showOnline)}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.showOnline ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.showOnline ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[16px] text-white font-normal">Mostrar visto por último</span>
                      <span className="text-[14px] text-zinc-400">Ocultar o horário de sua última actividade no chat</span>
                    </div>
                    <div
                      onClick={() => updateSetting("showLastSeen", !settings.showLastSeen)}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.showLastSeen ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.showLastSeen ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[16px] text-white font-normal">Confirmação de leitura</span>
                      <span className="text-[14px] text-zinc-400">Adicionar visibilidade do visto duplo de lido</span>
                    </div>
                    <div
                      onClick={() => updateSetting("readConfirmation", !settings.readConfirmation)}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.readConfirmation ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.readConfirmation ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Ações de mensagens
                </span>

                <div className="flex flex-col gap-[8px]">
                  <button 
                    onClick={() => {
                        showToast("Todas as conversas foram arquivadas");
                    }}
                    className="flex items-center justify-between p-[8px] bg-zinc-800 hover:bg-zinc-700 rounded-[6px] text-left transition-all border-none bg-transparent cursor-pointer"
                  >
                    <span className="text-[16px] text-white font-normal">Arquivar todas as conversas</span>
                    <span className="text-[14px] text-zinc-400">Limpa a tela principal</span>
                  </button>

                  <button 
                    onClick={() => {
                        showToast("Histórico local de conversas limpo");
                    }}
                    className="flex items-center justify-between p-[8px] bg-zinc-800 hover:bg-zinc-700 rounded-[6px] text-left transition-all border-none bg-transparent cursor-pointer"
                  >
                    <span className="text-[16px] text-white font-normal">Apagar todo histórico do chat</span>
                    <span className="text-[14px] text-zinc-400">Destruição imediata de mensagens</span>
                  </button>

                  <button 
                    onClick={() => {
                      showToast("Backup de mensagens concluído com sucesso");
                    }}
                    className="flex items-center justify-between p-[8px] bg-zinc-800 hover:bg-zinc-700 rounded-[6px] text-left transition-all border-none bg-transparent cursor-pointer"
                  >
                    <span className="text-[16px] text-white font-normal">Fazer backup seguro agora</span>
                    <span className="text-[14px] text-zinc-400">Último backup feito ontem</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {currentSubView === "inventory" && (
            <div className="flex flex-col gap-[8px]">
              
              <div className="grid grid-cols-3 gap-[8px]">
                <div className="bg-zinc-900 p-[8px] rounded-[8px] flex flex-col items-center justify-center text-center gap-[4px]">
                  <span className="text-[26px] font-normal text-white leading-none">{settings.activeAds.length + settings.pausedAds.length}</span>
                  <span className="text-[14px] font-normal text-zinc-405 leading-tight">Anúncios</span>
                </div>
                <div className="bg-zinc-900 p-[8px] rounded-[8px] flex flex-col items-center justify-center text-center gap-[4px]">
                  <span className="text-[26px] font-normal text-white leading-none">12</span>
                  <span className="text-[14px] font-normal text-zinc-405 leading-tight">Vendidos</span>
                </div>
                <div className="bg-zinc-900 p-[8px] rounded-[8px] flex flex-col items-center justify-center text-center gap-[4px]">
                  <span className="text-[26px] font-normal text-white leading-none">5</span>
                  <span className="text-[14px] font-normal text-zinc-405 leading-tight">Comprados</span>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Dados de gestão
                </span>

                <div className="flex flex-col gap-[8px]">
                  {[
                    { title: "Meus anúncios cadastrados", count: `${settings.activeAds.length} activos` },
                    { title: "Lista de despesas e compras feitas", count: "5 fechados" },
                    { title: "Meus produtos etiquetados", count: "6 itens" },
                    { title: "Favoritos e listas salvas", count: "9 itens favoritados" },
                  ].map((inv) => (
                    <div 
                      key={inv.title}
                      onClick={() => showToast(`Abrindo gerenciador de ${inv.title.toLowerCase()}`)}
                      className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px] cursor-pointer hover:bg-zinc-700 transition-all"
                    >
                      <span className="text-[16px] text-white font-normal">{inv.title}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[14px] text-neutral-400">{inv.count}</span>
                        <ChevronRight className="w-6 h-6 text-zinc-400" strokeWidth={3} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Histórico de negociações
                </span>

                <div className="flex flex-col gap-[8px]">
                  <div className="bg-zinc-800 p-[8px] rounded-[6px] flex flex-col gap-[4px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[16px] text-white font-normal">Iphone treze pro max</span>
                      <span className="text-[14px] text-white font-normal uppercase">Venda fechada</span>
                    </div>
                    <div className="flex justify-between text-[14px] text-zinc-400">
                      <span>Proposta de carlos alberto</span>
                      <span>Preço final acordado</span>
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-[8px] rounded-[6px] flex flex-col gap-[4px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[16px] text-white font-normal">Tênis casual nike</span>
                      <span className="text-[14px] text-zinc-400 font-normal uppercase">Em negociação</span>
                    </div>
                    <div className="flex justify-between text-[14px] text-zinc-400">
                      <span>Proposta enviada a marcus</span>
                      <span>Aguardando resposta do comprador</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Avaliações feitas e recebidas
                </span>

                <div className="flex items-center gap-[10px] p-[8px] bg-zinc-800 rounded-[6px]">
                  <div className="flex flex-col items-center text-center pr-2 shrink-0 gap-[2px]">
                    <span className="text-[26px] font-normal text-white leading-none">4.8</span>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-normal">Pontos</span>
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[16px] text-white font-normal">Muito recomendado no portal boladas</span>
                    <span className="text-[14px] text-zinc-400">Total de dezoito avaliações de compradores verificados</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {currentSubView === "ads" && (
            <div className="flex flex-col gap-[8px]">
              
              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Automação de anúncios
                </span>

                <div className="flex flex-col gap-[8px]">
                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[16px] text-white font-normal">Renovação automática</span>
                      <span className="text-[14px] text-zinc-400">Renova o anúncio quando expirar às quatro semanas</span>
                    </div>
                    <div
                      onClick={() => updateSetting("autoRenew", !settings.autoRenew)}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.autoRenew ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.autoRenew ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px] text-left">
                      <span className="text-[16px] text-white font-normal">Destaque automático</span>
                      <span className="text-[14px] text-zinc-400">Impulsionar todos anúncios no topo da pesquisa</span>
                    </div>
                    <div
                      onClick={() => updateSetting("autoHighlight", !settings.autoHighlight)}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.autoHighlight ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.autoHighlight ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Pausar ou reativar anúncios
                </span>

                <div className="flex flex-col gap-[8px]">
                  
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[12px] font-normal text-zinc-400 uppercase pl-1">Ativos ({settings.activeAds.length})</span>
                    {settings.activeAds.map((ad) => (
                      <div key={ad} className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                        <span className="text-[16px] font-normal text-white truncate mr-2">{ad}</span>
                        <button 
                          onClick={() => {
                            const updatedActive = settings.activeAds.filter(a => a !== ad);
                            const updatedPaused = [...settings.pausedAds, ad];
                            setSettings(prev => ({
                              ...prev,
                              activeAds: updatedActive,
                              pausedAds: updatedPaused,
                            }));
                            showToast(`Anúncio pausado temporariamente`);
                          }}
                          className="bg-zinc-900 border-none hover:bg-zinc-950 text-white font-normal text-[14px] px-3 py-1.5 rounded cursor-pointer leading-none"
                        >
                          Pausar
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[12px] font-normal text-zinc-400 uppercase pl-1">Pausados ({settings.pausedAds.length})</span>
                    {settings.pausedAds.map((ad) => (
                      <div key={ad} className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                        <span className="text-[16px] font-normal text-zinc-500 truncate mr-2">{ad}</span>
                        <button 
                          onClick={() => {
                            const updatedPaused = settings.pausedAds.filter(a => a !== ad);
                            const updatedActive = [...settings.activeAds, ad];
                            setSettings(prev => ({
                              ...prev,
                              activeAds: updatedActive,
                              pausedAds: updatedPaused,
                            }));
                            showToast(`Anúncio reativado com sucesso`);
                          }}
                          className="bg-white border-none text-black font-normal text-[14px] px-3 py-1.5 rounded cursor-pointer leading-none"
                        >
                          Ativar
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          )}

          {currentSubView === "appearance" && (
            <div className="flex flex-col gap-[8px]">
              
              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Interface da aplicação
                </span>

                <div className="grid grid-cols-3 gap-[8px] p-1">
                  {[
                    { id: "escuro", label: "Tema escuro" },
                    { id: "claro", label: "Tema claro" },
                    { id: "sistema", label: "Automático" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => updateSetting("themeMode", preset.id)}
                      className={`p-[8px] text-[16px] rounded-[6px] text-center font-normal cursor-pointer select-none border-none ${
                        settings.themeMode === preset.id
                          ? "bg-white text-black"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                  <span className="text-[16px] text-neutral-300 font-normal">Tamanho da fonte</span>
                  <select
                    value={settings.fontSizeMenu}
                    onChange={(e) => updateSetting("fontSizeMenu", e.target.value)}
                    className="bg-zinc-950 text-white rounded p-1 text-[14px] border-none focus:outline-none"
                  >
                    <option value="pequeno">Pequeno compacto</option>
                    <option value="padrao">Padrão</option>
                    <option value="grande">Grande</option>
                  </select>
                </div>

                <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                  <span className="text-[16px] text-neutral-300 font-normal">Idioma principal</span>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSetting("language", e.target.value)}
                    className="bg-zinc-950 text-white rounded p-1 text-[14px] border-none focus:outline-none"
                  >
                    <option value="Português">Português</option>
                    <option value="Inglês">Inglês</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white uppercase tracking-wider px-1">
                  Desempenho e cache
                </span>

                <div className="flex flex-col gap-[8px]">
                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[16px] text-neutral-200 font-normal">Uso de cache de imagens</span>
                      <span className="text-[14px] text-zinc-400">Dados salvos localmente: <strong className="text-white">{settings.cacheSize}</strong></span>
                    </div>
                    <button
                      onClick={() => {
                        updateSetting("cacheSize", "0.0 mb");
                        showToast("Cache e ficheiros limpos com sucesso");
                      }}
                      className="bg-zinc-900 border-none text-white font-normal text-[14px] px-[12px] py-[6px] rounded-[6px] cursor-pointer hover:bg-black"
                    >
                      Limpar cache
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-[8px] bg-zinc-800 rounded-[6px]">
                    <div className="flex flex-col gap-[2px] text-left">
                      <span className="text-[16px] text-white font-normal">Modo de economia de dados</span>
                      <span className="text-[14px] text-zinc-400">Reduz qualidade de imagens em redes móveis</span>
                    </div>
                    <div
                      onClick={() => updateSetting("dataSaving", !settings.dataSaving)}
                      className="relative inline-flex items-center cursor-pointer transition-all shrink-0"
                    >
                      <div
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-[2px] ${
                          settings.dataSaving ? "bg-white" : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${
                            settings.dataSaving ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {currentSubView === "help" && (
            <div className="flex flex-col gap-[8px]">
              
              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white px-1">
                  Atendimento de suporte ativo
                </span>

                <div className="flex flex-col gap-[8px]">
                  <textarea
                    id="support-textarea"
                    rows={2}
                    placeholder="Descreva detalhadamente seu problema para o suporte..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="p-[8px] bg-zinc-800 rounded-[6px] text-white text-[16px] focus:outline-none resize-none border-none"
                  />

                  <div className="grid grid-cols-2 gap-[8px]">
                    <a 
                      href="https://wa.me/258840000000" 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-[8px] bg-zinc-800 rounded-[6px] hover:bg-zinc-750 transition-all text-center font-normal text-[14px] text-white flex items-center justify-center gap-[4px] decoration-none"
                    >
                      Suporte whatsapp
                    </a>

                    <button
                      onClick={() => {
                        if (!supportMessage.trim()) return;
                        setSupportMessage("");
                        showToast("Protocolo de suporte aberto com sucesso");
                      }}
                      className="bg-white hover:opacity-90 font-normal p-[8px] rounded-[6px] border-none text-[14px] text-black cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Send className="w-4 h-4 text-black" strokeWidth={3} />
                      <span>Enviar mensagem</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white px-1">
                  Perguntas frequentes
                </span>

                <div className="flex flex-col gap-[8px]">
                  {[
                    { 
                      q: "Como criar um anúncio gratuito no aplicativo", 
                      a: "Basta acessar a tela de criação, preencher os detalhes do produto, carregar as fotografias e confirmar a publicação direta",
                      btnLabel: "Criar anúncio gratuito",
                      action: () => {
                        if (onNavigate) {
                          onNavigate("anunciar");
                        } else if (onBack) {
                          onBack();
                        }
                      }
                    },
                    { 
                      q: "Como posso alterar o meu número de telefone", 
                      a: "Acesse as definições da conta, selecione as informações pessoais e atualize o seu contacto no formulário",
                      btnLabel: "Alterar número de telefone",
                      action: () => setCurrentSubView("profile")
                    },
                    { 
                      q: "Como entrar em contacto com o suporte técnico", 
                      a: "Você pode enviar uma mensagem direta pelo formulário de ajuda nesta tela ou usar o botão de suporte whatsapp",
                      btnLabel: "Falar com o suporte agora",
                      action: () => {
                        const el = document.getElementById("support-textarea");
                        if (el) el.focus();
                      }
                    },
                    { 
                      q: "É possível denunciar um comportamento suspeito", 
                      a: "Sim, você pode relatar qualquer comportamento irregular através da opção de informar problemas ou diretamente no chat",
                      btnLabel: "Denunciar comportamento",
                      action: () => {
                        if (onNavigate) onNavigate("denuncias");
                      }
                    },
                    { 
                      q: "Como gerenciar a privacidade do meu perfil", 
                      a: "Abra as configurações de segurança e privacidade para definir quem pode visualizar seus dados cadastrados",
                      btnLabel: "Ajustar definições de privacidade",
                      action: () => setCurrentSubView("security")
                    },
                    { 
                      q: "Como encontrar produtos facilmente no feed", 
                      a: "Utilize a barra de pesquisa rápida para filtrar por categoria, marca ou palavras-chave de interesse",
                      btnLabel: "Voltar para o feed de produtos",
                      action: () => {
                        if (onBack) onBack();
                      }
                    },
                  ].map((faq, idx) => {
                    const isExpanded = expandedFaq === idx;
                    return (
                      <div key={idx} className="flex flex-col bg-zinc-805 rounded-[6px] overflow-hidden">
                        <button
                          onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                          className="w-full text-left p-[8px] font-normal text-[16px] text-white flex justify-between items-center bg-zinc-800 border-none cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <span className="text-white font-normal">{isExpanded ? "−" : "+"}</span>
                        </button>
                        {isExpanded && (
                          <div className="p-[8px] bg-zinc-900 flex flex-col gap-[8px]">
                            <p className="text-[14px] text-zinc-300 leading-snug">
                              {faq.a}
                            </p>
                            <button
                              onClick={faq.action}
                              className="w-full p-[8px] bg-white text-black font-normal rounded-[6px] hover:opacity-90 active:scale-95 transition-all text-[14px] border-none cursor-pointer"
                            >
                              {faq.btnLabel}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-[8px] bg-zinc-900 p-[8px] rounded-[8px]">
                <span className="text-[14px] font-normal text-white px-1">
                  Documentos corporativos
                </span>

                <div className="grid grid-cols-2 gap-[8px] p-1 text-center">
                  {[
                    "Termos de uso",
                    "Políticas de privacidade",
                    "Uso de cookies",
                    "Licença de uso",
                  ].map((label) => (
                    <button
                      key={label}
                      onClick={() => setViewingDoc(label)}
                      className="p-[8px] bg-zinc-800 hover:bg-zinc-750 text-white font-normal text-[14px] rounded-[6px] cursor-pointer border-none"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          <div className="flex justify-center py-[8px]">
            <button
              onClick={() => {
                setCurrentSubView(null);
              }}
              className="px-[12px] py-[8px] rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer text-[14px] border-none font-normal"
            >
              Voltar ao menu anterior
            </button>
          </div>

        </div>
      )}

      {viewingDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-[8px] z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-[12px] p-[16px] max-w-lg w-full flex flex-col gap-[8px] max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-[8px]">
              <h3 className="text-[20px] font-bold text-white">
                {viewingDoc}
              </h3>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-[4px] text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer"
              >
                <X className="w-6 h-6" strokeWidth={3} />
              </button>
            </div>
            <div className="text-[14px] text-zinc-300 leading-relaxed overflow-y-auto pr-[4px]">
              {viewingDoc === "Termos de uso" && (
                <div className="flex flex-col gap-[8px]">
                  <p className="font-bold text-white text-[16px]">1. Aceitação dos termos</p>
                  <p>Ao acessar e utilizar o portal Boladas, você concorda expressamente em cumprir todos os presentes termos e condições de uso, bem como a legislação moçambicana vigente.</p>
                  <p className="font-bold text-white text-[16px]">2. Publicação de anúncios</p>
                  <p>Os anúncios devem ser verídicos, conter descrições claras sobre o estado do produto e valores reais. É estritamente proibida a publicação de produtos ilegais, réplicas não autorizadas ou serviços proibidos.</p>
                  <p className="font-bold text-white text-[16px]">3. Responsabilidade do utilizador</p>
                  <p>Cada utilizador é integralmente responsável pelas informações prestadas, pelas mensagens enviadas no chat e pelas negociações comerciais efetuadas com outros utilizadores.</p>
                  <p className="font-bold text-white text-[16px]">4. Moderação e bloqueios</p>
                  <p>O portal Boladas reserva-se o direito de remover anúncios enganosos e suspender ou banir utilizadores que violem as regras de boa convivência ou cometam fraudes.</p>
                </div>
              )}
              {viewingDoc === "Políticas de privacidade" && (
                <div className="flex flex-col gap-[8px]">
                  <p className="font-bold text-white text-[16px]">1. Recolha de informação</p>
                  <p>Recolhemos informações básicas de cadastro como nome completo, contacto telefónico, endereço de e-mail e dados necessários para a sincronização da conta.</p>
                  <p className="font-bold text-white text-[16px]">2. Proteção de dados</p>
                  <p>Utilizamos sistemas avançados integrados ao Supabase e Firestore para criptografar os seus dados, garantindo que suas senhas e PINs de segurança estejam totalmente encriptados e invisíveis a terceiros.</p>
                  <p className="font-bold text-white text-[16px]">3. Partilha de dados</p>
                  <p>Não vendemos nem partilhamos dados pessoais de utilizadores com anunciantes ou terceiros. Seus dados de contacto são exibidos apenas de acordo com o nível de visibilidade definido por si nas definições de segurança.</p>
                  <p className="font-bold text-white text-[16px]">4. Direitos do utilizador</p>
                  <p>Você pode, a qualquer momento, atualizar seus dados pessoais, alterar o PIN de segurança, ativar/desativar a autenticação de dois fatores, ou solicitar a eliminação definitiva da sua conta.</p>
                </div>
              )}
              {viewingDoc === "Uso de cookies" && (
                <div className="flex flex-col gap-[8px]">
                  <p className="font-bold text-white text-[16px]">1. O que são cookies?</p>
                  <p>Cookies são pequenos ficheiros de texto armazenados no seu dispositivo para melhorar a velocidade e a personalização de navegação no aplicativo.</p>
                  <p className="font-bold text-white text-[16px]">2. Cookies essenciais</p>
                  <p>Utilizamos cookies essenciais para manter a sua sessão activa de forma segura (armazenados localmente via localStorage ou cookies de sessão) para que não precise de fazer login repetidamente.</p>
                  <p className="font-bold text-white text-[16px]">3. Cookies de preferências</p>
                  <p>Estes cookies memorizam as suas preferências de personalização, como o modo de visualização escuro/claro, tamanho da fonte escolhido no menu e as definições de notificações.</p>
                  <p className="font-bold text-white text-[16px]">4. Como controlar cookies?</p>
                  <p>Através das configurações de privacidade do seu navegador, você pode limpar, recusar ou bloquear cookies, ciente de que isso poderá afetar certas funcionalidades do portal.</p>
                </div>
              )}
              {viewingDoc === "Licença de uso" && (
                <div className="flex flex-col gap-[8px]">
                  <p className="font-bold text-white text-[16px]">1. Concessão de licença</p>
                  <p>É concedida ao utilizador uma licença limitada, pessoal, revogável, não-exclusiva e intransferível para aceder e usar o aplicativo Boladas estritamente para fins pessoais.</p>
                  <p className="font-bold text-white text-[16px]">2. Restrições de uso</p>
                  <p>É expressamente proibido realizar engenharia reversa no código do aplicativo, extrair dados em massa de anúncios (scraping), ou revender as tecnologias aqui integradas sem consentimento por escrito.</p>
                  <p className="font-bold text-white text-[16px]">3. Propriedade intelectual</p>
                  <p>Todas as marcas, logótipos, designs, interfaces de utilizador e bases de dados pertencem exclusivamente aos proprietários e parceiros do portal Boladas.</p>
                  <p className="font-bold text-white text-[16px]">4. Limitação de responsabilidade</p>
                  <p>A licença é disponibilizada "tal como está". Não nos responsabilizamos por eventuais instabilidades temporárias de rede ou danos indiretos resultantes de transações comerciais autónomas.</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setViewingDoc(null)}
              className="w-full mt-[8px] p-[8px] bg-white text-black font-normal rounded-[6px] hover:opacity-90 active:scale-95 transition-all text-[14px] border-none cursor-pointer"
            >
              Fechar documento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
