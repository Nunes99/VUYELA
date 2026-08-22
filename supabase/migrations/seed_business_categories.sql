-- Initial marketplace taxonomy for Mozambique. Categories remain editable in
-- PostgreSQL and are referenced by businesses rather than hard-coded in UI.

insert into public.business_categories (slug, name, description, sort_order, is_active)
values
  ('alimentacao-restauracao', 'Alimentação e restauração', 'Restaurantes, cafés, pastelarias e serviços de alimentação.', 10, true),
  ('beleza-bem-estar', 'Beleza e bem-estar', 'Salões, barbearias, estética e cuidados pessoais.', 20, true),
  ('saude-farmacia', 'Saúde e farmácia', 'Farmácias, clínicas e serviços de saúde.', 30, true),
  ('retalho-lojas', 'Retalho e lojas', 'Lojas, supermercados, moda e comércio especializado.', 40, true),
  ('hotelaria-turismo', 'Hotelaria e turismo', 'Hotéis, alojamento, viagens e experiências turísticas.', 50, true),
  ('servicos-profissionais', 'Serviços profissionais', 'Consultoria, manutenção e outros serviços especializados.', 60, true),
  ('tecnologia-telecomunicacoes', 'Tecnologia e telecomunicações', 'Informática, eletrónica, software e telecomunicações.', 70, true),
  ('educacao-formacao', 'Educação e formação', 'Escolas, centros de formação e serviços educativos.', 80, true),
  ('entretenimento-lazer', 'Entretenimento e lazer', 'Eventos, cultura, diversão e atividades recreativas.', 90, true),
  ('automovel-mobilidade', 'Automóvel e mobilidade', 'Oficinas, peças, lavagem e serviços de mobilidade.', 100, true),
  ('fitness-desporto', 'Fitness e desporto', 'Ginásios, clubes e serviços desportivos.', 110, true),
  ('outros-servicos', 'Outros serviços', 'Negócios que não se enquadram nas restantes categorias.', 999, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
