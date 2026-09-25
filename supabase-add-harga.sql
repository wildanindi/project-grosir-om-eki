alter table public.barangs
add column if not exists harga numeric(14, 2) not null default 0;

comment on column public.barangs.harga is 'Harga jual barang dalam rupiah';
