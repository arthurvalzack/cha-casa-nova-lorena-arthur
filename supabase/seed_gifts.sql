-- Lista inicial de presentes. Pode ser executada mais de uma vez sem duplicar ou sobrescrever itens.
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS gifts_slug_unique_idx ON public.gifts (slug) WHERE slug IS NOT NULL;

WITH categories(name, slug, sort_order) AS (
  VALUES
    ('Mesa Posta', 'mesa-posta', 1), ('Utensílios de Cozinha', 'utensilios-de-cozinha', 2),
    ('Panelas e Assadeiras', 'panelas-e-assadeiras', 3), ('Eletrodomésticos', 'eletrodomesticos', 4),
    ('Quarto', 'quarto', 5), ('Banheiro', 'banheiro', 6), ('Lavanderia e Limpeza', 'lavanderia-e-limpeza', 7),
    ('Sala e Decoração', 'sala-e-decoracao', 8), ('Organização', 'organizacao', 9), ('Ferramentas e Utilidades', 'ferramentas-e-utilidades', 10)
)
INSERT INTO public.gift_categories (name, slug, sort_order, is_active)
SELECT name, slug, sort_order, true FROM categories
ON CONFLICT (slug) DO NOTHING;

WITH seed(category, names) AS (
  VALUES
    ('Mesa Posta', ARRAY['Jogo de pratos rasos','Jogo de pratos fundos','Jogo de pratos de sobremesa','Jogo de copos','Jogo de taças','Jogo de xícaras','Faqueiro','Sousplat','Jogo americano','Jarra de vidro','Jarra para suco','Balde de gelo','Petisqueira','Travessa para servir','Travessa de vidro','Jogo de bowls','Tigelas','Saleiro','Açucareiro','Manteigueira','Boleira','Talheres']),
    ('Utensílios de Cozinha', ARRAY['Jogo de facas','Tábua de corte de madeira','Escorredor de louças','Escorredor de macarrão','Espremedor de frutas','Moedor de pimenta','Porta-condimentos','Porta-temperos','Kit de utensílios de silicone','Suporte para papel toalha','Suporte para filtro de café','Kit de potes de vidro','Potes herméticos','Jogo de potes para mantimentos','Kit pia cozinha','Ralador','Peneira','Funil','Descascador de legumes','Abridor de latas','Abridor de garrafas','Saca-rolhas','Pilão','Concha','Escumadeira','Espátula de silicone','Colher de pau','Pegador de massa','Pegador de salada','Colheres medidoras','Xícaras medidoras','Luva térmica','Garrafa térmica']),
    ('Panelas e Assadeiras', ARRAY['Jogo de panelas','Panela de pressão','Frigideira','Leiteira','Forma de bolo quadrada','Forma de bolo redonda','Forma para cupcake','Assadeira antiaderente','Assadeira de vidro','Refratário de vidro']),
    ('Eletrodomésticos', ARRAY['Air Fryer','Liquidificador','Cafeteira','Sanduicheira','Batedeira','Mixer','Chaleira elétrica','Churrasqueira elétrica','Processador de alimentos','Espremedor elétrico']),
    ('Quarto', ARRAY['Jogo de lençol casal','Lençol com elástico casal','Jogo de fronhas','Edredom casal','Cobertor casal','Colcha casal','Manta para cama','Protetor de colchão','Travesseiros','Saia para cama box','Capa para travesseiro','Almofadas']),
    ('Banheiro', ARRAY['Jogo de toalhas completo','Tapete para banheiro','Lixeira para banheiro','Porta-papel higiênico','Organizador de bancada','Bandeja para banheiro','Cesto organizador para banheiro','Kit banheiro','Escova sanitária']),
    ('Lavanderia e Limpeza', ARRAY['Vassoura','Rodo','Rodo mágico','Pá de lixo','Balde','Mop spray','Mop giratório','Mop','Escova de limpeza','Lixeira para lavanderia','Cesto para roupas','Cesto para prendedores','Porta-sabão em pó','Dispenser para sabão líquido','Varal de chão','Kit de pregadores','Panos de prato','Panos de chão','Flanelas']),
    ('Sala e Decoração', ARRAY['Cortina para sala','Cortina para quarto blackout','Abajur','Lixeira para cozinha','Ventilador','Umidificador de ar']),
    ('Organização', ARRAY['Caixa organizadora com tampa','Caixa organizadora','Cabides transparentes']),
    ('Ferramentas e Utilidades', ARRAY['Kit de ferramentas básico','Escada dobrável','Furadeira','Ferro de passar','Aspirador de pó'])
), expanded AS (
  SELECT category, item.name, item.position::integer AS item_order
  FROM seed CROSS JOIN LATERAL unnest(names) WITH ORDINALITY AS item(name, position)
), prepared AS (
  SELECT
    expanded.*,
    trim(both '-' FROM regexp_replace(lower(translate(name,
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')), '[^a-z0-9]+', '-', 'g')) AS slug,
    CASE name
      WHEN 'Jogo de copos' THEN 2 WHEN 'Jogo de taças' THEN 2 WHEN 'Jogo de xícaras' THEN 2
      WHEN 'Sousplat' THEN 2 WHEN 'Jogo americano' THEN 2 WHEN 'Kit de potes de vidro' THEN 2
      WHEN 'Potes herméticos' THEN 3 WHEN 'Jogo de potes para mantimentos' THEN 2
      WHEN 'Panos de prato' THEN 5 WHEN 'Panos de chão' THEN 5 WHEN 'Flanelas' THEN 5
      WHEN 'Cabides transparentes' THEN 20 WHEN 'Travesseiros' THEN 2 WHEN 'Almofadas' THEN 4
      WHEN 'Jogo de toalhas completo' THEN 2 WHEN 'Kit de pregadores' THEN 2
      WHEN 'Caixa organizadora' THEN 3 WHEN 'Caixa organizadora com tampa' THEN 3 ELSE 1 END AS quantity,
    CASE category
      WHEN 'Mesa Posta' THEN 'Um detalhe especial para receber com carinho no novo lar.'
      WHEN 'Utensílios de Cozinha' THEN 'Essencial para o nosso dia a dia na cozinha.'
      WHEN 'Panelas e Assadeiras' THEN 'Perfeito para preparar novas memórias à mesa.'
      WHEN 'Eletrodomésticos' THEN 'Um presente útil para essa nova fase.'
      WHEN 'Quarto' THEN 'Para deixar nossos momentos de descanso ainda mais acolhedores.'
      WHEN 'Banheiro' THEN 'Um cuidado prático e cheio de carinho para nossa casa.'
      WHEN 'Lavanderia e Limpeza' THEN 'Essencial para manter o novo lar sempre organizado.'
      WHEN 'Sala e Decoração' THEN 'Para deixar nossa casa mais confortável e bonita.'
      WHEN 'Organização' THEN 'Um item prático para completar cada cantinho da casa.'
      ELSE 'Uma utilidade importante para o nosso novo lar.' END AS description,
    CASE category
      WHEN 'Mesa Posta' THEN 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80'
      WHEN 'Utensílios de Cozinha' THEN 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80'
      WHEN 'Panelas e Assadeiras' THEN 'https://images.unsplash.com/photo-1584990347449-a0d3a896e7c3?auto=format&fit=crop&w=900&q=80'
      WHEN 'Eletrodomésticos' THEN 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80'
      WHEN 'Quarto' THEN 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
      WHEN 'Banheiro' THEN 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80'
      WHEN 'Lavanderia e Limpeza' THEN 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80'
      WHEN 'Sala e Decoração' THEN 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80'
      WHEN 'Organização' THEN 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80'
      ELSE 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80' END AS image_url
  FROM expanded
)
INSERT INTO public.gifts (category_id, name, slug, description, image_url, desired_quantity, available_quantity, suggested_pix_value, is_active, sort_order)
SELECT c.id, p.name, p.slug, p.description, p.image_url, p.quantity, p.quantity, NULL, true, c.sort_order * 100 + p.item_order
FROM prepared p
JOIN public.gift_categories c ON c.name = p.category
WHERE NOT EXISTS (
  SELECT 1 FROM public.gifts g WHERE g.slug = p.slug OR lower(g.name) = lower(p.name)
);
