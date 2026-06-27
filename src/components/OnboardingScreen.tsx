import React, { useState, useRef, useEffect } from "react";
import { Camera, ArrowRight, User, FileText, Check, Phone, MapPin, Shield, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { uploadImage } from "../lib/supabase";

interface OnboardingScreenProps {
  user: any;
  userProfile: any;
  onComplete: () => void;
}

export default function OnboardingScreen({ user, userProfile, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1); // Step 1: Profile Info, Step 2: Privacy Policy
  const [name, setName] = useState(userProfile?.name || user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [location, setLocation] = useState(userProfile?.location || "");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [avatar, setAvatar] = useState(
    userProfile?.avatar_url || 
    user?.user_metadata?.avatar_url || 
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
  );
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep initial values in sync with asynchronously loaded user or userProfile
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if ((userProfile || user) && !hasLoadedRef.current) {
      if (userProfile?.name) setName(userProfile.name);
      else if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name);

      if (userProfile?.phone) setPhone(userProfile.phone);
      if (userProfile?.location) setLocation(userProfile.location);
      if (userProfile?.bio) setBio(userProfile.bio);

      if (userProfile?.avatar_url) setAvatar(userProfile.avatar_url);
      else if (user?.user_metadata?.avatar_url) setAvatar(user.user_metadata.avatar_url);

      if (userProfile || (user?.user_metadata?.full_name || user?.user_metadata?.avatar_url)) {
        hasLoadedRef.current = true;
      }
    }
  }, [userProfile, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem selecionada é muito grande! Escolha um arquivo de no máximo 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
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
              setAvatar(canvas.toDataURL("image/jpeg", 0.6));
            } else {
              setAvatar(reader.result as string);
            }
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoToPrivacy = () => {
    if (!name.trim()) {
      alert("Por favor, introduza o seu nome.");
      return;
    }
    if (!phone.trim()) {
      alert("Por favor, introduza o seu número de celular.");
      return;
    }
    if (!location.trim()) {
      alert("Por favor, introduza a sua localização.");
      return;
    }
    setStep(2);
  };

  const handleSaveAndComplete = async () => {
    if (!acceptedPrivacy || !acceptedTerms) {
      alert("Por favor, leia e aceite os termos de serviço e as políticas de privacidade para continuar.");
      return;
    }
    setSaving(true);
    try {
      let finalAvatar = avatar;
      
      // If avatar is a new base64 image, upload to Supabase
      if (avatar && avatar.startsWith("data:image")) {
        try {
          finalAvatar = await uploadImage(avatar, 'images', `profiles/${user.id}`);
        } catch (uploadErr: any) {
          console.error("Erro ao fazer upload da imagem:", uploadErr);
          if (uploadErr.message?.includes("bucket")) {
            alert(uploadErr.message);
            setSaving(false);
            return;
          }
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
          bio: bio.trim(),
          avatar_url: finalAvatar,
          onboarded: true,
          accepted_privacy: true,
          privacy_accepted_at: new Date().toISOString(),
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error("Erro ao salvar perfil onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto min-h-[90vh] flex flex-col justify-center px-4 md:px-8 py-10 animate-fade-in bg-transparent text-white">
      {step === 1 ? (
        <>
          {/* Header section with pure lines, no solid cards */}
          <header className="mb-10 text-left border-b border-zinc-800 pb-5">
            <h1 className="font-chivo text-[24px] md:text-[32px] font-black text-white tracking-tight leading-tight">
              Configurar Perfil
            </h1>
            <p className="font-hanken text-[12px] md:text-[14px] text-zinc-400 font-medium mt-1">
              Complete os seus dados de vendedor para começar a negociar no Boladas.
            </p>
          </header>

          {/* Hidden native file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Main Form Fields without card styling, just pure input line style */}
          <div className="flex flex-col gap-8 w-full">
            {/* Row block: Avatar aligned with the name field on the exact same row/line */}
            <div className="flex items-end gap-6 w-full">
              {/* Avatar upload/preview widget */}
              <div className="relative shrink-0 flex flex-col items-center">
                <div className="relative w-20 h-20 group">
                  <img
                    src={avatar}
                    alt="Avatar Preview"
                    className="w-full h-full rounded-full object-cover border-2 border-zinc-700 shadow-xl transition-all duration-300 group-hover:border-zinc-500"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-zinc-700 rounded-full text-white hover:bg-zinc-650 active:scale-95 transition-all shadow-md focus:outline-none cursor-pointer"
                    title="Fazer upload de foto"
                  >
                    <Camera className="w-4 h-4 text-white" strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Name Input on the same line */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="font-hanken text-[11px] font-black tracking-wider text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  Nome de exibição
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-b border-zinc-700 text-white font-semibold text-[17px] py-[6px] outline-none placeholder:text-zinc-500 focus:border-white transition-colors"
                  placeholder="Ex: Marcus Silva"
                  required
                />
              </div>
            </div>

            {/* celular / phone number input block */}
            <div className="flex flex-col gap-1 w-full">
              <label className="font-hanken text-[11px] font-black tracking-wider text-white flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                Número de celular / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 text-white font-semibold text-[16px] py-[6px] outline-none placeholder:text-zinc-500 focus:border-white transition-colors"
                placeholder="Ex: +244 923 000 000"
                required
              />
            </div>

            {/* Localização / Location input block */}
            <div className="flex flex-col gap-1 w-full">
              <label className="font-hanken text-[11px] font-black tracking-wider text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                Localização / cidade / província
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 text-white font-semibold text-[16px] py-[6px] outline-none placeholder:text-zinc-500 focus:border-white transition-colors"
                placeholder="Ex: Luanda, Angola"
                required
              />
            </div>

            {/* Biography Block - Line styled field */}
            <div className="flex flex-col gap-1 w-full">
              <label className="font-hanken text-[11px] font-black tracking-wider text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                Biografia / slogan de vendas
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 text-white font-medium text-[15px] py-1.5 outline-none placeholder:text-zinc-500 focus:border-white transition-colors resize-none h-16 min-h-[64px]"
                placeholder="Ex: Vendedor experiente de eletrodomésticos e eletrônicos..."
              />
            </div>
          </div>

          {/* White styled submit button */}
          <div className="mt-12 flex justify-end">
            <button
              onClick={handleGoToPrivacy}
              disabled={!name.trim() || !phone.trim() || !location.trim()}
              className="w-full bg-white hover:bg-neutral-100 text-black font-extrabold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none rounded-[8px] h-12 flex items-center justify-center gap-2 tracking-wide cursor-pointer shadow-md"
            >
              <span>Avançar para políticas</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Step 2: Privacy Policy screen */}
          <header className="mb-8 text-left border-b border-zinc-800 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-zinc-400" />
              <span className="font-hanken text-[11px] font-black tracking-widest text-zinc-400">Etapa 2 de 2</span>
            </div>
            <h1 className="font-chivo text-[24px] md:text-[32px] font-black text-white tracking-tight leading-tight">
              Políticas de privacidade
            </h1>
            <p className="font-hanken text-[12px] md:text-[14px] text-zinc-400 font-medium mt-1">
              Leia e aceite os nossos termos para garantir a sua segurança e a de todos os membros no Boladas.
            </p>
          </header>

          {/* Privacy content scroll box */}
          <div className="max-h-[350px] overflow-y-auto bg-zinc-950/80 border border-zinc-800 rounded-[8px] p-5 md:p-6 mb-8 text-zinc-300 font-hanken text-[13px] leading-relaxed flex flex-col gap-5 scrollbar-thin scrollbar-thumb-zinc-700">
            <div>
              <h3 className="font-bold text-white text-[12px] tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                1. Introdução e propósito do Boladas
              </h3>
              <p>
                O Boladas é uma plataforma de classificados concebida para aproximar compradores e vendedores. Não intervimos diretamente no pagamento, envio de mercadorias ou na entrega de produtos. Todo o negócio é negociado de forma autônoma e direta entre as partes envolvidas.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white text-[12px] tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                2. Informações de visibilidade pública
              </h3>
              <p>
                Para facilitar o contato comercial imediato, o seu <strong>Nome de Exibição</strong>, <strong>Foto de Perfil</strong>, <strong>Número de Celular</strong> e <strong>Localização</strong> serão exibidos publicamente nos seus anúncios e chats. Estes dados destinam-se exclusivamente a permitir que potenciais compradores entrem em contacto direto consigo por via telefónica ou WhatsApp.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white text-[12px] tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                3. Diretrizes de segurança para venda
              </h3>
              <p>
                Recomendamos sempre o cumprimento rigoroso destas boas práticas de segurança:
              </p>
              <ul className="list-disc pl-5 mt-2 flex flex-col gap-1.5 text-zinc-400">
                <li>Dê preferência a encontros em locais públicos, movimentados e bem iluminados (ex: shoppings, esquadras, etc.).</li>
                <li>Nunca envie mercadoria antes de receber e confirmar o pagamento de forma segura na sua conta bancária.</li>
                <li>Desconfie de propostas com valores excessivamente abaixo do preço de mercado.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white text-[12px] tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                4. Conteúdo proibido
              </h3>
              <p>
                É expressamente proibido anunciar armas, substâncias ilegais, produtos contrafeitos (falsificações), serviços de caráter enganoso ou fraudes financeiras. Qualquer anúncio não conforme será imediatamente apagado e a conta do infrator será banida permanentemente sem aviso prévio.
              </p>
            </div>

            <div className="border-t border-zinc-900 pt-4 text-[11px] text-zinc-500">
              Última atualização: Junho de 2026. Ao clicar em concordar, confirma ter idade mínima recomendada por lei e concorda com todos os termos descritos acima.
            </div>
          </div>

          {/* Interactive Checkbox Section */}
          <div className="flex flex-col gap-[8px] mb-[8px]">
            <div className="flex items-start gap-[8px] bg-zinc-950/40 p-[8px] rounded-[8px] border border-zinc-900 hover:border-zinc-500 transition-colors">
              <button
                type="button"
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className={`w-5 h-5 shrink-0 rounded-[8px] border-2 flex items-center justify-center transition-all cursor-pointer ${
                  acceptedTerms 
                    ? "border-white bg-white text-black" 
                    : "border-zinc-750 bg-transparent hover:border-zinc-500"
                }`}
              >
                {acceptedTerms && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </button>
              <div className="flex flex-col gap-[2px]">
                <label 
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                  className="font-hanken font-bold text-[13px] text-white cursor-pointer select-none"
                >
                  Li e aceito os termos de serviço e condições do Boladas
                </label>
                <span className="font-hanken text-[10px] text-zinc-500">
                  Necessário para a utilização segura da plataforma.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-[8px] bg-zinc-950/40 p-[8px] rounded-[8px] border border-zinc-900 hover:border-zinc-500 transition-colors">
              <button
                type="button"
                onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
                className={`w-5 h-5 shrink-0 rounded-[8px] border-2 flex items-center justify-center transition-all cursor-pointer ${
                  acceptedPrivacy 
                    ? "border-white bg-white text-black" 
                    : "border-zinc-750 bg-transparent hover:border-zinc-500"
                }`}
              >
                {acceptedPrivacy && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </button>
              <div className="flex flex-col gap-[2px]">
                <label 
                  onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
                  className="font-hanken font-bold text-[13px] text-white cursor-pointer select-none"
                >
                  Li e aceito as políticas de privacidade do Boladas
                </label>
                <span className="font-hanken text-[10px] text-zinc-500">
                  Necessário para publicar seus anúncios com segurança.
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons (Voltar & Confirmar) */}
          <div className="flex items-center gap-[8px] mt-[8px]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 h-12 rounded-[8px] border border-zinc-800 text-zinc-400 font-bold text-[14px] hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
            >
              Voltar
            </button>
            <button
              onClick={handleSaveAndComplete}
              disabled={saving || !acceptedPrivacy || !acceptedTerms}
              className="flex-1 bg-white hover:bg-neutral-100 text-black font-extrabold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none rounded-[8px] h-12 flex items-center justify-center gap-[8px] tracking-wide cursor-pointer shadow-md"
            >
              {saving ? (
                <span>A processar...</span>
              ) : (
                <>
                  <span>Aceitar e finalizar</span>
                  <Check className="w-4 h-4 text-black" strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
