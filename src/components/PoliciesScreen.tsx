import { ArrowLeft, Shield, FileText } from "lucide-react";

interface PoliciesScreenProps {
  type: "terms" | "privacy";
  onBack: () => void;
}

export default function PoliciesScreen({ type, onBack }: PoliciesScreenProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center px-4 z-40">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900 border-none cursor-pointer text-white hover:bg-zinc-800 transition-colors mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="font-chivo text-[18px] font-black text-white leading-none">
            {type === "terms" ? "Termos de Serviço" : "Política de Privacidade"}
          </h1>
          <span className="font-hanken text-[12px] text-zinc-400">
            Legal Boladas
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="pt-[80px] px-4 pb-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
             {type === "terms" ? (
                <FileText className="w-6 h-6 text-white" />
             ) : (
                <Shield className="w-6 h-6 text-white" />
             )}
          </div>
          <div>
             <h2 className="text-xl font-bold text-white">
               {type === "terms" ? "Condições de Utilização" : "Privacidade e Dados"}
             </h2>
             <div className="flex flex-col gap-[4px] mt-1">
               <p className="text-xs text-zinc-400">Atualizado em 21 de Junho de 2026</p>
               <p className="text-xs text-zinc-500 font-mono">
                 Link:{" "}
                 <a
                   href={type === "terms" ? "#termos" : "#privacidade"}
                   className="text-white hover:underline cursor-pointer"
                 >
                   boladas.co.mz/{type === "terms" ? "termos" : "privacidade"}
                 </a>
               </p>
             </div>
          </div>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-900 rounded-[12px] p-6 text-zinc-300 font-hanken text-[14px] leading-relaxed flex flex-col gap-6">
          {type === "terms" ? (
            <>
              <section>
                <h3 className="font-bold text-white text-[15px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  1. Aceitação dos Termos
                </h3>
                <p>
                  Ao acessar e utilizar o aplicativo Boladas, você concorda em cumprir e sujeitar-se a estes Termos de Serviço. Se não concordar com qualquer parte, não poderá utilizar os nossos serviços.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-white text-[15px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  2. Descrição do Serviço
                </h3>
                <p>
                  O Boladas é uma plataforma de classificados concebida para aproximar compradores e vendedores. Não intervimos diretamente no pagamento, envio de mercadorias ou na entrega de produtos. Todo o negócio é negociado de forma autônoma e direta entre as partes envolvidas.
                </p>
              </section>
              
              <section>
                <h3 className="font-bold text-white text-[15px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  3. Conduta do Usuário e Conteúdo Proibido
                </h3>
                <p>
                  É expressamente proibido anunciar armas, substâncias ilegais, produtos contrafeitos (falsificações), serviços de caráter enganoso ou fraudes financeiras. Qualquer anúncio não conforme será imediatamente apagado e a conta do infrator será banida permanentemente sem aviso prévio. Ameaças e ofensas no chat resultam em bloqueio da conta.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-white text-[15px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  4. Isenção de Responsabilidade
                </h3>
                <p>
                  Não garantimos a veracidade ou qualidade dos itens anunciados por terceiros no aplicativo. É da sua exclusiva responsabilidade negociar e inspecionar produtos antes de realizar qualquer pagamento. Teste os equipamentos em locais movimentados antes de comprar.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="font-bold text-white text-[15px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  1. Informações que Coletamos
                </h3>
                <p>
                  Coletamos seus dados básicos de cadastro (nome, e-mail, e foto) diretamente fornecidos por você ou por parceiros (como login via Google). Também coletamos métricas de utilização e seu número de telefone e cidade.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-white text-[15px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  2. Informações de Visibilidade Pública
                </h3>
                <p>
                  Para facilitar o contato comercial imediato, o seu nome, foto de perfil, número de celular e localização serão exibidos publicamente nos seus anúncios e listagens. Estes dados destinam-se exclusivamente a permitir que potenciais compradores entrem em contacto direto consigo.
                </p>
              </section>
              
              <section>
                <h3 className="font-bold text-white text-[15px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  3. Tratamento e Segurança
                </h3>
                <p>
                  Os seus dados estão armazenados nas infraestruturas do Google (Firebase) e encontram-se protegidos por regras rigorosas e encriptação padrão. Respeitamos a sua privacidade e não comercializamos os seus dados com plataformas terceiras de marketing.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-white text-[15px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  4. Eliminação de Dados
                </h3>
                <p>
                  A qualquer momento, você pode solicitar a eliminação completa dos seus dados contatando a nossa equipe de suporte ou através de recursos que poderão vir a estar disponíveis nas Definições do aplicativo.
                </p>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
