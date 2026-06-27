-- TABELA DE PERFIS (Extensão do auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  name text,
  avatar_url text,
  bio text,
  location text,
  phone text,
  isOnline boolean default false,
  settings jsonb default '{}'::jsonb,
  followed_sellers jsonb default '{}'::jsonb,
  bookmarks jsonb default '{}'::jsonb,
  onboarded boolean default false,
  accepted_privacy boolean default false,
  privacy_accepted_at timestamp with time zone,
  accepted_terms boolean default false,
  terms_accepted_at timestamp with time zone
);

-- TABELA DE PRODUTOS
create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  price numeric not null,
  description text,
  image_url text,
  images text[] default '{}',
  badge text,
  category text not null,
  subcategory text,
  views integer default 0,
  location text
);

-- TABELA DE COMENTÁRIOS
create table public.comentarios (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  product_id uuid references public.products(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  text text not null
);

-- TABELA DE DENÚNCIAS
create table public.denuncias (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  product_id uuid references public.products(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  details text
);

-- CONFIGURAR RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.comentarios enable row level security;
alter table public.denuncias enable row level security;

-- POLÍTICAS DE PERFIS
create policy "Perfis são visíveis para todos" on public.profiles for select using (true);
create policy "Usuários podem editar o próprio perfil" on public.profiles for update using (auth.uid() = id);

-- POLÍTICAS DE PRODUTOS
create policy "Produtos são visíveis para todos" on public.products for select using (true);
create policy "Usuários autenticados podem criar produtos" on public.products for insert with check (auth.uid() = seller_id);
create policy "Usuários podem editar os próprios produtos" on public.products for update using (auth.uid() = seller_id);
create policy "Usuários podem deletar os próprios produtos" on public.products for delete using (auth.uid() = seller_id);

-- POLÍTICAS DE COMENTÁRIOS
create policy "Comentários são visíveis para todos" on public.comentarios for select using (true);
create policy "Usuários autenticados podem comentar" on public.comentarios for insert with check (auth.uid() = author_id);
create policy "Usuários podem deletar os próprios comentários" on public.comentarios for delete using (auth.uid() = author_id);

-- POLÍTICAS DE DENÚNCIAS
create policy "Usuários veem suas próprias denúncias ou desenvolvedor vê todas" on public.denuncias 
  for select using (
    auth.uid() = reporter_id or 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'developer'
    )
  );

create policy "Usuários autenticados podem denunciar" on public.denuncias 
  for insert with check (auth.uid() = reporter_id);

create policy "Desenvolvedores podem atualizar ou responder denúncias" on public.denuncias 
  for update using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'developer'
    )
  );

-- TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE NO SIGNUP
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''), 
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TABELA DE CHATS
create table public.chats (
  id text primary key,
  participantes uuid[] not null,
  ultima_mensagem text default '',
  data_ultima_atualizacao timestamp with time zone default now(),
  nao_lidas jsonb default '{}'::jsonb,
  nomes_participantes jsonb default '{}'::jsonb,
  imagens_participantes jsonb default '{}'::jsonb,
  produto jsonb default null,
  criado_em timestamp with time zone default now()
);

-- TABELA DE MENSAGENS
create table public.mensagens (
  id uuid default gen_random_uuid() primary key,
  conversa_id text references public.chats(id) on delete cascade not null,
  remetente_id uuid references public.profiles(id) on delete cascade not null,
  conteudo text not null,
  tipo text default 'texto',
  status text default 'enviada',
  data_envio timestamp with time zone default now()
);

-- TABELA DE NOTIFICAÇÕES
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  description text not null,
  product_name text,
  product_id text,
  sender_id uuid references public.profiles(id) on delete cascade,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- TABELA DE AVALIAÇÕES
create table public.avaliacoes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vendedor_id text not null, -- seller_name
  estrelas integer not null check (estrelas >= 1 and estrelas <= 5),
  comentario text,
  updated_at timestamp with time zone default now(),
  unique(user_id, vendedor_id)
);

-- CONFIGURAR STORAGE (BUCKET DE IMAGENS)
-- Nota: Execute isto no SQL Editor do Supabase para criar o bucket e as políticas
insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

-- Políticas para o bucket 'images'
create policy "Imagens são públicas" on storage.objects for select using (bucket_id = 'images');
create policy "Usuários autenticados podem fazer upload" on storage.objects for insert with check (
  bucket_id = 'images' and auth.role() = 'authenticated'
);

-- GARANTIR COLUNAS NA TABELA DE PRODUTOS (Migração segura)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='image_url') then
    alter table public.products add column image_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='description') then
    alter table public.products add column description text;
  end if;
end $$;

-- GARANTIR COLUNAS NA TABELA DE PERFIS (Migração segura)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='isonline') then
    alter table public.profiles add column isonline boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='onboarded') then
    alter table public.profiles add column onboarded boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='phone') then
    alter table public.profiles add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='followed_sellers') then
    alter table public.profiles add column followed_sellers jsonb default '{}'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='bookmarks') then
    alter table public.profiles add column bookmarks jsonb default '{}'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='settings') then
    alter table public.profiles add column settings jsonb default '{}'::jsonb;
  end if;
end $$;

-- GARANTIR COLUNAS NA TABELA DE DENÚNCIAS (Migração segura)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='denuncias' and column_name='status') then
    alter table public.denuncias add column status text default 'Aberto';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='denuncias' and column_name='replies') then
    alter table public.denuncias add column replies jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='denuncias' and column_name='product_name') then
    alter table public.denuncias add column product_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='denuncias' and column_name='seller_name') then
    alter table public.denuncias add column seller_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='denuncias' and column_name='seller_id') then
    alter table public.denuncias add column seller_id uuid;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='denuncias' and column_name='reporter_name') then
    alter table public.denuncias add column reporter_name text;
  end if;
end $$;

-- HABILITAR RLS
alter table public.chats enable row level security;
alter table public.mensagens enable row level security;
alter table public.notifications enable row level security;
alter table public.avaliacoes enable row level security;

-- POLÍTICAS DE CHATS
create policy "Usuários podem ver chats que participam" on public.chats for select using (auth.uid() = any(participantes));
create policy "Usuários podem criar chats" on public.chats for insert with check (auth.uid() = any(participantes));
create policy "Usuários podem atualizar seus chats" on public.chats for update using (auth.uid() = any(participantes));

-- POLÍTICAS DE MENSAGENS
create policy "Usuários podem ver mensagens de seus chats" on public.mensagens for select using (
  exists (select 1 from public.chats where id = conversa_id and auth.uid() = any(participantes))
);
create policy "Usuários podem enviar mensagens para seus chats" on public.mensagens for insert with check (
  exists (select 1 from public.chats where id = conversa_id and auth.uid() = any(participantes))
);

-- POLÍTICAS DE NOTIFICAÇÕES
create policy "Usuários podem ver suas próprias notificações" on public.notifications for select using (auth.uid() = user_id);
create policy "Usuários podem atualizar suas próprias notificações" on public.notifications for update using (auth.uid() = user_id);
create policy "Qualquer um pode inserir notificações" on public.notifications for insert with check (true);

-- POLÍTICAS DE AVALIAÇÕES
create policy "Avaliações são visíveis para todos" on public.avaliacoes for select using (true);
create policy "Usuários autenticados podem avaliar" on public.avaliacoes for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar suas próprias avaliações" on public.avaliacoes for update using (auth.uid() = user_id);
create policy "Usuários podem deletar suas próprias avaliações" on public.avaliacoes for delete using (auth.uid() = user_id);

-- TABELA DE BUGS
create table if not exists public.bugs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  status text default 'Aberto',
  replies jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- ADICIONAR COLUNA DE ROLE NOS PERFIS SE NÃO EXISTIR
alter table public.profiles add column if not exists role text default 'user';

-- HABILITAR RLS PARA BUGS
alter table public.bugs enable row level security;

-- POLÍTICAS PARA BUGS
create policy "Usuários veem seus próprios bugs ou desenvolvedor vê todos" on public.bugs 
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'developer'
    )
  );

create policy "Usuários podem relatar seus próprios bugs" on public.bugs 
  for insert with check (auth.uid() = user_id);

create policy "Desenvolvedores ou criadores podem atualizar ou responder bugs" on public.bugs 
  for update using (
    auth.uid() = user_id or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'developer'
    )
  );

-- FUNÇÃO PARA INCREMENTAR VISUALIZAÇÕES
create or replace function public.increment_product_views(product_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.products
  set views = coalesce(views, 0) + 1
  where id = product_id;
end;
$$;

