import { ShoppingBag, Star, Truck, ShieldCheck } from "lucide-react";

const products = [
  { id: 1, name: "Produit Premium 1", price: 49.99, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", badge: "Bestseller" },
  { id: 2, name: "Produit Premium 2", price: 79.99, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", badge: "Nouveau" },
  { id: 3, name: "Produit Premium 3", price: 29.99, image: "https://images.unsplash.com/photo-1560343090-f4fdf2024d40?w=500", badge: "-20%" },
];

export default function Home() {
  return (
    <main>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#E4DFD7]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-[#D94E34] rounded-lg flex items-center justify-center text-white"><ShoppingBag size={18}/></div>
            MON STORE
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-[#52525B]">
            <a href="#">Boutique</a><a href="#">Collections</a><a href="#">Contact</a>
          </nav>
          <button className="bg-[#18181B] text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2">
            <ShoppingBag size={16}/> Panier (0)
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#F1ECE4]">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-[#FDECE8] text-[#B83D26] px-3 py-1 rounded-full text-xs font-bold tracking-widest">NOUVELLE COLLECTION 2026</span>
            <h1 className="text-5xl md:text-6xl font-black leading-[0.9] mt-4">STYLE & <span className="text-[#D94E34]">QUALITÉ</span> PREMIUM</h1>
            <p className="text-[#52525B] mt-4 max-w-lg">Découvrez notre sélection de produits premium. Livraison rapide, paiement sécurisé, retours gratuits.</p>
            <div className="flex gap-3 mt-8">
              <button className="bg-[#D94E34] hover:bg-[#B83D26] text-white px-8 py-3.5 rounded-full font-bold">Acheter maintenant</button>
              <button className="bg-white border border-[#E4DFD7] px-8 py-3.5 rounded-full font-bold">Découvrir</button>
            </div>
            <div className="flex gap-6 mt-8 text-sm">
              <span className="flex items-center gap-2"><Truck size={16}/> Livraison gratuite</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16}/> Paiement sécurisé</span>
            </div>
          </div>
          <div className="relative h-[420px] rounded-[32px] overflow-hidden bg-white">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800" alt="Hero" className="w-full h-full object-cover kenburns-bg"/>
          </div>
        </div>
      </section>

      {/* Produits */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-black">Produits populaires</h2>
          <a href="#" className="text-sm font-bold underline">Voir tout</a>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-[24px] border border-[#E4DFD7] overflow-hidden group hover:shadow-xl transition">
              <div className="relative h-72 overflow-hidden bg-[#FAF8F5]">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                <span className="absolute top-3 left-3 bg-[#D94E34] text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>
              </div>
              <div className="p-5">
                <h3 className="font-bold">{p.name}</h3>
                <div className="flex items-center gap-1 text-amber-500 text-xs mt-1"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/> <span className="text-[#52525B] ml-1">(124)</span></div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-black">{p.price.toFixed(2)} €</span>
                  <button className="bg-[#18181B] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-black">Ajouter</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E4DFD7] py-8 text-center text-sm text-[#52525B]">
        © 2026 Mon Store Arena • Propulsé par Next.js & Cloudflare
      </footer>
    </main>
  );
}
