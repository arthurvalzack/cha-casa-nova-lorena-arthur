export interface DefaultGift {
  name: string
  slug: string
  category: string
  description: string
  image_url: string
  desired_quantity: number
  available_quantity: number
  suggested_pix_value: null
  sort_order: number
  is_active: true
}

const categoryImages: Record<string, string> = {
  'Mesa Posta': 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80',
  'Utensílios de Cozinha': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80',
  'Panelas e Assadeiras': 'https://images.unsplash.com/photo-1584990347449-a0d3a896e7c3?auto=format&fit=crop&w=900&q=80',
  'Eletrodomésticos': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80',
  Quarto: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
  Banheiro: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80',
  'Lavanderia e Limpeza': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  'Sala e Decoração': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80',
  Organização: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
  'Ferramentas e Utilidades': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
}

const categoryDescriptions: Record<string, string> = {
  'Mesa Posta': 'Um detalhe especial para receber com carinho no novo lar.',
  'Utensílios de Cozinha': 'Essencial para o nosso dia a dia na cozinha.',
  'Panelas e Assadeiras': 'Perfeito para preparar novas memórias à mesa.',
  'Eletrodomésticos': 'Um presente útil para essa nova fase.',
  Quarto: 'Para deixar nossos momentos de descanso ainda mais acolhedores.',
  Banheiro: 'Um cuidado prático e cheio de carinho para nossa casa.',
  'Lavanderia e Limpeza': 'Essencial para manter o novo lar sempre organizado.',
  'Sala e Decoração': 'Para deixar nossa casa mais confortável e bonita.',
  Organização: 'Um item prático para completar cada cantinho da casa.',
  'Ferramentas e Utilidades': 'Uma utilidade importante para o nosso novo lar.',
}

const itemsByCategory: Record<string, string[]> = {
  'Mesa Posta': ['Jogo de pratos rasos', 'Jogo de pratos fundos', 'Jogo de pratos de sobremesa', 'Jogo de copos', 'Jogo de taças', 'Jogo de xícaras', 'Faqueiro', 'Sousplat', 'Jogo americano', 'Jarra de vidro', 'Jarra para suco', 'Balde de gelo', 'Petisqueira', 'Travessa para servir', 'Travessa de vidro', 'Jogo de bowls', 'Tigelas', 'Saleiro', 'Açucareiro', 'Manteigueira', 'Boleira', 'Talheres'],
  'Utensílios de Cozinha': ['Jogo de facas', 'Tábua de corte de madeira', 'Escorredor de louças', 'Escorredor de macarrão', 'Espremedor de frutas', 'Moedor de pimenta', 'Porta-condimentos', 'Porta-temperos', 'Kit de utensílios de silicone', 'Suporte para papel toalha', 'Suporte para filtro de café', 'Kit de potes de vidro', 'Potes herméticos', 'Jogo de potes para mantimentos', 'Kit pia cozinha', 'Ralador', 'Peneira', 'Funil', 'Descascador de legumes', 'Abridor de latas', 'Abridor de garrafas', 'Saca-rolhas', 'Pilão', 'Concha', 'Escumadeira', 'Espátula de silicone', 'Colher de pau', 'Pegador de massa', 'Pegador de salada', 'Colheres medidoras', 'Xícaras medidoras', 'Luva térmica', 'Garrafa térmica'],
  'Panelas e Assadeiras': ['Jogo de panelas', 'Panela de pressão', 'Frigideira', 'Leiteira', 'Forma de bolo quadrada', 'Forma de bolo redonda', 'Forma para cupcake', 'Assadeira antiaderente', 'Assadeira de vidro', 'Refratário de vidro'],
  'Eletrodomésticos': ['Air Fryer', 'Liquidificador', 'Cafeteira', 'Sanduicheira', 'Batedeira', 'Mixer', 'Chaleira elétrica', 'Churrasqueira elétrica', 'Processador de alimentos', 'Espremedor elétrico'],
  Quarto: ['Jogo de lençol casal', 'Lençol com elástico casal', 'Jogo de fronhas', 'Edredom casal', 'Cobertor casal', 'Colcha casal', 'Manta para cama', 'Protetor de colchão', 'Travesseiros', 'Saia para cama box', 'Capa para travesseiro', 'Almofadas'],
  Banheiro: ['Jogo de toalhas completo', 'Tapete para banheiro', 'Lixeira para banheiro', 'Porta-papel higiênico', 'Organizador de bancada', 'Bandeja para banheiro', 'Cesto organizador para banheiro', 'Kit banheiro', 'Escova sanitária'],
  'Lavanderia e Limpeza': ['Vassoura', 'Rodo', 'Rodo mágico', 'Pá de lixo', 'Balde', 'Mop spray', 'Mop giratório', 'Mop', 'Escova de limpeza', 'Lixeira para lavanderia', 'Cesto para roupas', 'Cesto para prendedores', 'Porta-sabão em pó', 'Dispenser para sabão líquido', 'Varal de chão', 'Kit de pregadores', 'Panos de prato', 'Panos de chão', 'Flanelas'],
  'Sala e Decoração': ['Cortina para sala', 'Cortina para quarto blackout', 'Abajur', 'Lixeira para cozinha', 'Ventilador', 'Umidificador de ar'],
  Organização: ['Caixa organizadora com tampa', 'Caixa organizadora', 'Cabides transparentes'],
  'Ferramentas e Utilidades': ['Kit de ferramentas básico', 'Escada dobrável', 'Furadeira', 'Ferro de passar', 'Aspirador de pó'],
}

const quantities: Record<string, number> = {
  'Jogo de copos': 2, 'Jogo de taças': 2, 'Jogo de xícaras': 2, Sousplat: 2, 'Jogo americano': 2,
  'Kit de potes de vidro': 2, 'Potes herméticos': 3, 'Jogo de potes para mantimentos': 2,
  'Panos de prato': 5, 'Panos de chão': 5, Flanelas: 5, 'Cabides transparentes': 20,
  Travesseiros: 2, Almofadas: 4, 'Jogo de toalhas completo': 2, 'Kit de pregadores': 2,
  'Caixa organizadora': 3, 'Caixa organizadora com tampa': 3,
}

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const defaultGiftCategories = Object.keys(itemsByCategory)

export const defaultGifts: DefaultGift[] = defaultGiftCategories.flatMap((category, categoryIndex) =>
  itemsByCategory[category].map((name, itemIndex) => {
    const quantity = quantities[name] ?? 1
    return {
      name,
      slug: slugify(name),
      category,
      description: categoryDescriptions[category],
      image_url: categoryImages[category],
      desired_quantity: quantity,
      available_quantity: quantity,
      suggested_pix_value: null,
      sort_order: (categoryIndex + 1) * 100 + itemIndex + 1,
      is_active: true,
    }
  }),
)
