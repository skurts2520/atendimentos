-- Rode este script no Supabase: SQL Editor > New query > Run

create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  contato text,
  telefone text,
  email text,
  endereco text,
  created_at timestamptz not null default now()
);

create table if not exists atendimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete restrict,
  cliente_nome text not null,
  tipo text not null default 'impressora' check (tipo in ('impressora','pc','outro')),
  descricao text,
  solucao text,
  status text not null default 'concluido' check (status in ('aberto','em_andamento','concluido')),
  data_atendimento date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists atendimentos_data_idx on atendimentos (data_atendimento desc);
create index if not exists atendimentos_empresa_idx on atendimentos (empresa_id);

-- Segurança: cada usuário só enxerga e altera os próprios dados
alter table empresas enable row level security;
alter table atendimentos enable row level security;

create policy "empresas_dono" on empresas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "atendimentos_dono" on atendimentos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
