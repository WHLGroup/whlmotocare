export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  compatibility: string[];
  featured: boolean;
  active: boolean;
};

export const brands = ["Yamaha", "Kingboss", "Kinglion", "SanLG", "Lifan", "LiFO"];

export const categories = [
  { id: "engine", name: "Engine Parts", image: "/images/engine-piston.png", shortName: "Engine" },
  { id: "brakes", name: "Brakes & Clutch", image: "/images/brake-shoes.png", shortName: "Brakes" },
  { id: "tyres", name: "Tyres & Tubes", image: "/images/motorcycle-tyre.png", shortName: "Tyres" },
  { id: "electrical", name: "Electrical", image: "/images/spark-plug.png", shortName: "Electrical" },
  { id: "chains", name: "Chains & Sprockets", image: "/images/chain-kit.png", shortName: "Chains" },
  { id: "oils", name: "Oils & Lubricants", image: "/images/engine-oil.png", shortName: "Oils" },
];

export const services = [
  "General service & tune-up",
  "Engine diagnostics & repair",
  "Brakes & clutch repair",
  "Electrical repairs",
  "Tyre & wheel service",
  "Not sure — inspect my bike",
];

export const initialProducts: Product[] = [
  { id: "ngk-spark-plug", name: "NGK Spark Plug", category: "electrical", price: 6500, description: "A dependable spark for a smoother start. A replacement spark plug for selected commuter motorcycles. Tell us your bike model so our team can confirm the correct fit before collection.", image: "/images/spark-plug.png", compatibility: ["Yamaha", "Kingboss", "Kinglion", "SanLG", "Lifan", "LiFO"], featured: true, active: true },
  { id: "heavy-duty-brake-shoes", name: "Heavy-Duty Brake Shoes", category: "brakes", price: 18500, description: "Ride with more confidence. A replacement pair of drum brake shoes for everyday stopping performance. Our mechanics will confirm the drum size and fitment for your motorcycle.", image: "/images/brake-shoes.png", compatibility: ["Yamaha", "Kingboss", "Kinglion", "Lifan"], featured: true, active: true },
  { id: "chain-sprocket-kit", name: "Chain & Sprocket Kit", category: "chains", price: 42000, description: "Keep power moving to your rear wheel. A replacement drive chain with front and rear sprockets. Chain pitch, link count and sprocket teeth are confirmed against your bike model.", image: "/images/chain-kit.png", compatibility: ["Yamaha", "Kingboss", "Kinglion", "SanLG", "Lifan", "LiFO"], featured: true, active: true },
  { id: "4t-engine-oil", name: "4T Motorcycle Engine Oil", category: "oils", price: 15000, description: "Give your engine the care it deserves. 1 litre of 10W-40 four-stroke motorcycle oil for routine servicing. Always follow the viscosity and specification recommended for your motorcycle.", image: "/images/engine-oil.png", compatibility: ["Yamaha", "Kingboss", "Kinglion", "SanLG", "Lifan", "LiFO"], featured: true, active: true },
  { id: "piston-ring-kit", name: "Piston & Ring Kit", category: "engine", price: 38000, description: "A precision replacement piston, wrist pin and piston rings for selected motorcycle engines. Engine capacity and bore size must be confirmed by our team before supply or fitting.", image: "/images/engine-piston.png", compatibility: ["Kingboss", "Kinglion", "SanLG", "Lifan", "LiFO"], featured: false, active: true },
  { id: "commuter-motorcycle-tyre", name: "All-Road Motorcycle Tyre", category: "tyres", price: 65000, description: "Reliable grip for your everyday ride. A durable commuter motorcycle tyre. Share the size printed on your current tyre and we will confirm the right replacement; fitting can be booked separately.", image: "/images/motorcycle-tyre.png", compatibility: ["Yamaha", "Kingboss", "Kinglion", "SanLG", "Lifan", "LiFO"], featured: false, active: true },
];

export const money = (amount: number) => `MK ${amount.toLocaleString("en-MW")}`;
export const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? id;
export const shopPhone = "+265884985461";
export const whatsappUrl = "https://wa.me/265884985461";
export const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Ndirande+Ma+Plot+COSYS+Blantyre+Malawi";
export const priceNotice = "Prices are indicative. We’ll confirm availability, exact fit and your final total before payment.";
