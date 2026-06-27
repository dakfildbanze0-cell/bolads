export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export const CATEGORIES: Category[] = [
  { id: "eletronicos", name: "Eletrónicos", icon: "Smartphone", subcategories: ["Telemóveis", "Computadores", "Tablets", "TVs", "Consolas", "Acessórios"] },
  { id: "veiculos", name: "Veículos", icon: "Car", subcategories: ["Carros", "Motorizadas", "Bicicletas", "Peças e Acessórios"] },
  { id: "imoveis", name: "Imóveis", icon: "Home", subcategories: ["Casas", "Apartamentos", "Quartos", "Terrenos", "Espaços Comerciais"] },
  { id: "moda", name: "Moda", icon: "Shirt", subcategories: ["Roupa Masculina", "Roupa Feminina", "Calçados", "Bolsas", "Acessórios"] },
  { id: "casa_moveis", name: "Casa e Móveis", icon: "Armchair", subcategories: ["Sofás", "Camas", "Mesas", "Cadeiras", "Decoração", "Eletrodomésticos"] },
  { id: "beleza", name: "Beleza", icon: "Sparkles", subcategories: ["Cosméticos", "Perfumes", "Produtos Capilares", "Cuidados Pessoais"] },
  { id: "desporto", name: "Desporto", icon: "Dumbbell", subcategories: ["Equipamentos Desportivos", "Bicicletas", "Fitness", "Vestuário Desportivo"] },
];
