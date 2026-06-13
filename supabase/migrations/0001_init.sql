create extension if not exists pgcrypto;

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  host_id text not null,
  selected_map text not null default 'grassland',
  round_duration integer not null default 120,
  status text not null default 'lobby',
  created_at timestamp with time zone not null default now()
);

create table if not exists players (
  id text primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  nickname text not null,
  is_host boolean not null default false,
  score integer not null default 0,
  connected boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_players_room_id on players(room_id);
create index if not exists idx_rooms_room_code on rooms(room_code);

create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  loser_id text not null,
  round_number integer not null,
  created_at timestamp with time zone not null default now()
);

alter table rooms enable row level security;
alter table players enable row level security;
alter table match_results enable row level security;

create policy "allow public room reads" on rooms for select using (true);
create policy "allow public room writes" on rooms for insert with check (true);
create policy "allow public room updates" on rooms for update using (true) with check (true);

create policy "allow public player reads" on players for select using (true);
create policy "allow public player writes" on players for insert with check (true);
create policy "allow public player updates" on players for update using (true) with check (true);

create policy "allow public results reads" on match_results for select using (true);
create policy "allow public results writes" on match_results for insert with check (true);
