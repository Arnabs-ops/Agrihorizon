import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { MessagingSystem } from "./MessagingSystem";
import { NotificationCenter } from "./NotificationCenter";
import { MarketPrices } from "./MarketPrices";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import paymentQr from "./assets/payment-qr.jpg";
import { CommunityHub } from "./CommunityHub";
import { useLanguage } from "./useLanguage.tsx";
import buyerBg from "./assets/buyer_bg.png";
import { WelcomeModal } from "./WelcomeModal";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { HelpButton } from "./HelpButton";
import { useTutorial } from "./TutorialProvider";
import { VoiceInput } from "./components/common/VoiceInput";

import { UserProfile } from "./types/user";

interface BuyerDashboardProps {
  userProfile: UserProfile;
}

interface Product {
  _id: Id<"products">;
  sellerId: Id<"users">;
  name: string;
  description?: string;
  price: number;
  unit: string;
  category: string;
  stockQuantity: number;
  imageEmoji: string;
  imageStorageId?: Id<"_storage">;
  imageUrl?: string | null;
  isActive: boolean;
  priceTiers?: Array<{ minQuantity: number; price: number }>;
  seller: {
    user: any;
    profile: {
      fullName: string;
      businessName?: string;
      [key: string]: any;
    } | null;
  };
}

interface Order {
  _id: Id<"orders">;
  status: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  orderDate: number;
  productId: Id<"products">;
  sellerId: Id<"users">;
  deliveryAddress?: string;
  isPaid?: boolean;
  paymentDate?: number;
  driverName?: string;
  driverPhone?: string;
  deliveryStep?: "assigning" | "picking_up" | "delivering" | "delivered";
  product: {
    name: string;
    unit: string;
    imageEmoji: string;
    [key: string]: any;
  } | null;
  seller: {
    user: any;
    profile: {
      fullName: string;
      businessName?: string;
      [key: string]: any;
    } | null;
  };
}
interface Review {
  _id: Id<"reviews">;
  productId: Id<"products">;
  buyerId: Id<"users">;
  sellerId: Id<"users">;
  rating: number;
  comment: string;
  createdAt: number;
  buyerName: string;
}



export function BuyerDashboard({ userProfile }: BuyerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showMessaging, setShowMessaging] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});

  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [pendingOrder, setPendingOrder] = useState<{ productId: Id<"products">, sellerId: Id<"users"> } | null>(null);

  // Tutorial state
  const { tutorialProgress } = useTutorial();

  const { t } = useLanguage();

  const { user, profile } = userProfile;
  const marketplaceProducts = (useQuery(api.products.getMarketplaceProducts) || []) as Product[];
  const allOrders = (useQuery(api.orders.getBuyerOrders) || []) as Order[];
  const createOrder = useMutation(api.orders.createOrder);
  const markOrdersAsPaid = useMutation(api.orders.markOrdersAsPaid);
  const deleteOrder = useMutation(api.orders.deleteOrder);
  const updateProfile = useMutation(api.users.createUserProfile);

  const cartItems = useMemo(() => allOrders.filter((o) => o.isPaid === false), [allOrders]);
  const buyerOrders = useMemo(() => allOrders.filter((o) => o.isPaid === true || o.isPaid === undefined), [allOrders]);

  const handlePayment = async () => {
    try {
      await markOrdersAsPaid({
        orderIds: cartItems.map(item => item._id)
      });
      toast.success("Payment successful! Orders are now being processed.");
      setShowPayment(false);
      setShowCart(false);
    } catch (error) {
      toast.error("Payment failed. Please try again.");
      console.error(error);
    }
  };

  if (!profile) {
    return <div>Error: Profile not found</div>;
  }

  // Filter products based on search and category
  const filteredProducts = marketplaceProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seller.profile?.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(marketplaceProducts.map(p => p.category))];

  // Calculate stats
  const activeOrders = buyerOrders.filter(order =>
    order.status === "pending" || order.status === "processing" || order.status === "shipped"
  ).length;

  const handleCreateOrder = async (productId: Id<"products">, sellerId: Id<"users">) => {
    // Check if user has an address
    if (!profile.location) {
      setPendingOrder({ productId, sellerId });
      setShowAddressModal(true);
      return;
    }

    const quantity = orderQuantities[productId] || 1;

    try {
      await createOrder({
        productId,
        quantity,
        deliveryAddress: profile.location,
      });

      toast.success(t('addedToCart'));
      setOrderQuantities(prev => ({ ...prev, [productId]: 1 }));
    } catch (error) {
      toast.error(t('addToCartFailed'));
      console.error(error);
    }
  };

  const handleRemoveFromCart = async (orderId: Id<"orders">) => {
    try {
      await deleteOrder({ orderId });
      toast.success(t('removedFromCart') || "Item removed from cart");
    } catch (error) {
      toast.error(t('removeFailed') || "Failed to remove item");
      console.error(error);
    }
  };

  const handleUpdateAddress = async () => {
    if (!newAddress.trim()) {
      toast.error("Please enter a valid address");
      return;
    }

    try {
      // Re-using createUserProfile as it acts as an "upsert" for profile details
      await updateProfile({
        role: "buyer",
        fullName: profile.fullName,
        location: newAddress,
      });
      toast.success("Address updated!");

      const addr = newAddress;
      setShowAddressModal(false);
      setNewAddress("");

      // If there was a pending order, proceed with it
      if (pendingOrder) {
        const quantity = orderQuantities[pendingOrder.productId] || 1;
        await createOrder({
          productId: pendingOrder.productId,
          quantity,
          deliveryAddress: addr,
        });
        toast.success(t('addedToCart'));
        setOrderQuantities(prev => ({ ...prev, [pendingOrder.productId]: 1 }));
        setPendingOrder(null);
      }
    } catch (error) {
      toast.error("Failed to update address");
    }
  };

  const calculateItemTotal = (item: Order) => {
    // Frontend logic to find the correct tier price for cart display
    let unitPrice = item.unitPrice || 0;
    const product = marketplaceProducts.find(p => p._id === item.productId);

    if (product?.priceTiers && product.priceTiers.length > 0) {
      const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
      const tier = sortedTiers.find(t => item.quantity >= t.minQuantity);
      if (tier) {
        unitPrice = tier.price;
      }
    }
    return unitPrice * item.quantity;
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const cartTotal = calculateCartTotal();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8 animate-entry">
      {/* Premium Welcome Header */}
      <div className="rounded-2xl p-8 modern-shadow relative min-h-[220px] flex items-center">
        {/* Dynamic Background Image with Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0 scale-105 animate-slow-zoom"
            style={{
              backgroundImage: `url(${buyerBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.7)'
            }}
          >
            <div className="absolute inset-0 bg-slate-900/30 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse z-10"></div>
        <div className="flex items-center justify-between relative z-50 w-full">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner animate-float">
              <span className="text-4xl">🛒</span>
            </div>
            <div>
              <p className="text-slate-300 font-bold tracking-widest uppercase text-xs mb-2 drop-shadow-md">{t('buyerTerminal')}</p>
              <h1 className="text-4xl font-black leading-tight drop-shadow-lg mb-3">
                <span className="text-white">{t('welcome')},</span><br />
                <span className="text-primary">{profile.fullName}!</span>
              </h1>
              {profile.location && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center text-sm font-semibold text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                    📍 {profile.location}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCart(true)}
              data-tour-id="cart-button"
              className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl active:scale-95 group border border-transparent dark:border-slate-800"
            >
              <span className="text-xl">🛒</span>
              <span className="font-bold">{t('cart')}</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-pulse">
                  {cartItems.length}
                </span>
              )}
            </button>
            <NotificationCenter onNavigate={(link) => setActiveTab(link)} />
            <button
              onClick={() => setShowMessaging(true)}
              data-tour-id="messages-button"
              className="group bg-slate-900 dark:bg-primary text-white px-6 py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-primary/90 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-slate-200 active:scale-95"
            >
              <span className="text-xl group-hover:rotate-12 transition-transform">💬</span>
              <span className="font-bold">{t('messages')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="glass-morphism rounded-3xl p-2 modern-shadow sticky top-24 z-40 backdrop-blur-xl">
        <nav className="flex items-center gap-1">
          {[
            { id: "overview", label: t('overview'), icon: "📊" },
            { id: "marketplace", label: t('marketplace'), icon: "🏪" },
            { id: "orders", label: t('myOrders'), icon: "📦" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-tour-id={tab.id === "marketplace" ? "marketplace-tab" : undefined}
              className={`flex items-center gap-3 py-3.5 px-6 rounded-2xl font-black text-sm tab-transition flex-1 justify-center transition-colors duration-200 ${activeTab === tab.id
                ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]"
                : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <span className={`text-xl ${activeTab === tab.id ? "animate-float" : ""}`}>{tab.icon}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}

          {/* More Features Dropdown */}
          <div className="relative group/more flex-1">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`w-full flex items-center gap-3 py-3.5 px-6 rounded-2xl font-black text-sm tab-transition justify-center transition-colors duration-200 ${["prices", "community"].includes(activeTab) || showMoreMenu
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <span className="text-xl">✨</span>
              <span className="hidden md:inline">More</span>
              <span className={`text-[10px] opacity-50 ml-1 transition-transform ${showMoreMenu ? "rotate-180" : ""}`}>▼</span>
            </button>

            {showMoreMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-scale-up z-50">
                {[
                  { id: "prices", label: t('marketIntelligence'), icon: "💰" },
                  { id: "community", label: t('communityHub'), icon: "🌱" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMoreMenu(false);
                    }}
                    data-tour-id={`${tab.id}-tab`}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                      ? "bg-primary/10 dark:bg-primary/20 text-primary"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8 animate-entry">
          <div className="dashboard-grid">
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">{t('marketplace')}</h3>
              <p className="text-6xl font-black mb-2">{marketplaceProducts.length}</p>
              <p className="text-sm font-bold opacity-70">{t('verifiedProducts')}</p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">{t('myOrders')}</h3>
              <p className="text-6xl font-black mb-2">{activeOrders}</p>
              <p className="text-sm font-bold opacity-70">{t('currentlyProcessing')}</p>
            </div>

            <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-black/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">{t('lifetimeRecords')}</h3>
              <p className="text-6xl font-black mb-2">{buyerOrders.length}</p>
              <p className="text-sm font-bold opacity-70">{t('allTimeRecords')}</p>
            </div>
          </div>

          <OnboardingChecklist userRole="buyer" />

          {profile.preferredProducts && profile.preferredProducts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 modern-shadow transition-colors duration-500">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                {t('catalogInterests')}
              </h3>
              <div className="flex flex-wrap gap-3">
                {profile.preferredProducts.map((product, index) => (
                  <span
                    key={index}
                    className="bg-primary/5 dark:bg-primary/20 text-primary border border-primary/10 px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-colors cursor-default"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 modern-shadow transition-colors duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <span className="w-2 h-8 bg-slate-900 dark:bg-white rounded-full"></span>
                {t('recentActivity')}
              </h3>
              <button onClick={() => setActiveTab("orders")} className="text-sm font-bold text-primary hover:underline">{t('viewAllOrders')} →</button>
            </div>
            <div className="space-y-4">
              {buyerOrders.slice(0, 3).map((order) => (
                <div key={order._id} className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-3xl">
                    {order.product?.imageEmoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-900 dark:text-white text-lg leading-tight">{order.product?.name}</p>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                      {order.quantity} {order.product?.unit} • <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(order.totalAmount)}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)} shadow-sm`}>
                      {order.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(order.orderDate)}</span>
                  </div>
                </div>
              ))}
              {buyerOrders.length === 0 && (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 font-bold">
                  <p className="text-slate-400 dark:text-slate-500">{t('noOrders')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "marketplace" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">{t('marketplace')}</h2>
            <div className="flex gap-4">
              <VoiceInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t('searchProducts')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('allCategories')}</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-xl transition-all group modern-shadow">
                <div className="relative h-40 mb-3 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-500">{product.imageEmoji}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{product.name}</h3>
                <div className="space-y-1 mb-2">
                  <p className="text-blue-600 font-bold">
                    {formatPrice(product.price)}/{product.unit}
                  </p>
                  {product.priceTiers && product.priceTiers.length > 0 && (
                    <div className="bg-amber-50 p-2 rounded border border-amber-100">
                      <p className="text-[10px] font-black uppercase text-amber-700 mb-1">{t('tieredPricing')}</p>
                      {product.priceTiers.map((tier, idx) => (
                        <p key={idx} className="text-xs text-amber-800">
                          {tier.minQuantity}+ {product.unit}: <span className="font-bold">{formatPrice(tier.price)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {t('by')} {product.seller.profile?.businessName || product.seller.profile?.fullName}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {t('stock')}: {product.stockQuantity} {product.unit}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={orderQuantities[product._id] || 1}
                    onChange={(e) => setOrderQuantities(prev => ({
                      ...prev,
                      [product._id]: parseInt(e.target.value) || 1
                    }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">{product.unit}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreateOrder(product._id, product.sellerId)}
                    disabled={product.stockQuantity === 0}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  >
                    {product.stockQuantity === 0 ? t('outOfStock') : t('addToCart')}
                  </button>
                  <button
                    onClick={() => setShowMessaging(true)}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Contact seller"
                  >
                    💬
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <ProductReviews productId={product._id} />
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('myOrders')}</h2>
          <div className="space-y-4">
            {buyerOrders.map((order) => (
              <div key={order._id} className="bg-white border border-gray-200 rounded-2xl p-6 modern-shadow space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                    <div className="text-4xl w-16 h-16 bg-slate-50 flex items-center justify-center rounded-xl shadow-inner">
                      {order.product?.imageEmoji}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-xl leading-tight">{order.product?.name}</h3>
                      <p className="text-sm font-bold text-slate-500 mt-1">
                        {t('seller')}: {order.seller.profile?.businessName || order.seller.profile?.fullName}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          📦 {order.quantity} {order.product?.unit}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          📅 {formatDate(order.orderDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-2xl mb-2">
                      {formatPrice(order.totalAmount)}
                    </p>
                    <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)} shadow-sm`}>
                      {t(order.status as any)}
                    </span>
                  </div>
                </div>

                {/* Delivery Simulation Tracker */}
                {order.isPaid && order.deliveryStep && (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">🚚</div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('driver')}</p>
                          <p className="font-bold text-slate-900">{order.driverName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('driverPhone')}</p>
                        <p className="font-bold text-primary">{order.driverPhone}</p>
                      </div>
                    </div>

                    <div className="relative pt-2 pb-12 mt-4">
                      {/* Progress Line Background */}
                      <div className="absolute top-4 left-0 w-full h-1 bg-slate-200 rounded-full"></div>
                      {/* Progress Line Active */}
                      <div
                        className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all duration-1000"
                        style={{
                          width: order.deliveryStep === "assigning" ? "12%" :
                            order.deliveryStep === "picking_up" ? "37%" :
                              order.deliveryStep === "delivering" ? "62%" : "100%"
                        }}
                      ></div>

                      {/* Steps */}
                      <div className="relative flex justify-between">
                        {[
                          { step: "assigning", icon: "📋", label: t('assigning') },
                          { step: "picking_up", icon: "📦", label: t('picking_up') },
                          { step: "delivering", icon: "🚚", label: t('delivering') },
                          { step: "delivered", icon: "🏠", label: t('deliveredStatus') },
                        ].map((s, idx) => {
                          const isCompleted = ["assigning", "picking_up", "delivering", "delivered"].indexOf(order.deliveryStep!) >= idx;
                          const isActive = order.deliveryStep === s.step;

                          return (
                            <div key={idx} className="flex flex-col items-center relative z-10 w-24">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition-all duration-500 ${isCompleted ? "bg-primary text-white scale-110" : "bg-white text-slate-300 border border-slate-200"
                                } ${isActive ? "ring-4 ring-primary/20 animate-pulse" : ""}`}>
                                {isCompleted ? "✓" : s.icon}
                              </div>
                              <div className="absolute top-10 w-full text-center">
                                <span className={`text-[9px] font-black uppercase tracking-tight leading-tight block ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                                  {s.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {buyerOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{t('noOrders')}</p>
                <button
                  onClick={() => setActiveTab("marketplace")}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('marketplace')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "prices" && (
        <MarketPrices userRole="buyer" />
      )}

      {activeTab === "community" && (
        <CommunityHub />
      )}

      {/* Tutorial Components */}
      {!tutorialProgress?.hasSeenWelcome && (
        <WelcomeModal
          userRole="buyer"
          onComplete={() => { }}
        />
      )}

      <HelpButton />

      {/* Cart Modal */}
      {
        showCart && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span>🛒</span> {t('yourCart')}
                </h2>
                <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 font-bold transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-4xl mb-4">🛒</p>
                    <p className="font-bold">{t('cartEmpty')}</p>
                  </div>
                ) : (
                  cartItems.map((item) => {
                    const product = marketplaceProducts.find(p => p._id === item.productId);
                    const isTiered = product?.priceTiers?.some(tier => item.quantity >= tier.minQuantity);
                    const itemTotal = calculateItemTotal(item);
                    const unitPrice = item.quantity > 0 ? itemTotal / item.quantity : item.unitPrice;

                    return (
                      <div key={item._id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center text-3xl shadow-sm">
                          {item.product?.imageEmoji}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">{item.product?.name}</h4>
                          <p className="text-sm text-slate-500">
                            {item.quantity} {item.product?.unit} × {formatPrice(unitPrice || 0)}
                          </p>
                          {isTiered && (
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                              {t('tieredPricing')} Applied
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="font-black text-lg text-primary">
                            {formatPrice(itemTotal)}
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item._id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title={t('remove') || "Remove"}
                          >
                            <span className="text-xl">🗑️</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
                }</div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                  <div className="flex justify-between items-center text-slate-600 text-sm font-bold">
                    <span>{t('subtotal')} ({cartItems.length} items)</span>
                    <span className="text-slate-900 text-xl font-black">{formatPrice(cartTotal)}</span>
                  </div>
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{t('proceedToPayment')}</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Payment Modal */}
      {
        showPayment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up border border-white/20">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <button onClick={() => setShowPayment(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors font-bold">✕</button>
                <h3 className="text-white/80 font-bold uppercase tracking-widest text-xs mb-2">{t('totalAmountDue')}</h3>
                <p className="text-5xl font-black text-white">{formatPrice(cartTotal)}</p>
              </div>

              <div className="p-8 flex flex-col items-center gap-6">
                <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <img src={paymentQr} alt="Payment QR Code" className="w-64 h-64 object-contain mix-blend-multiply mb-4" />
                  <p className="text-sm text-center text-slate-500 font-medium">{t('paymentInstructions')}</p>
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-100">
                    <span className="text-lg">💡</span>
                    <p className="leading-snug">{t('paymentWarning')}</p>
                  </div>

                  <button
                    onClick={handlePayment}
                    className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{t('verifyAndPay')} {formatPrice(cartTotal)}</span>
                    <span>✓</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Address Requirement Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-scale-up border border-slate-100">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-inner mx-auto">📍</div>
            <h3 className="text-2xl font-black text-slate-900 text-center mb-2">{t('addAddress')}</h3>
            <p className="text-slate-500 text-center font-medium mb-8 leading-relaxed">
              {t('deliveryAddressRequired')}
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Full Delivery Address
                </label>
                <VoiceInput
                  type="textarea"
                  value={newAddress}
                  onChange={setNewAddress}
                  placeholder={t('addressPlaceholder')}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-slate-700 min-h-[120px] resize-none shadow-inner"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setPendingOrder(null);
                  }}
                  className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleUpdateAddress}
                  className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95"
                >
                  {t('updateAddress')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messaging System */}
      {
        showMessaging && (
          <MessagingSystem onClose={() => setShowMessaging(false)} />
        )
      }
    </div >
  );
}

function ProductReviews({ productId }: { productId: Id<"products"> }) {
  const reviews = useQuery(api.reviews.getProductReviews, { productId }) as Review[] | undefined;
  const postReview = useMutation(api.reviews.postReview);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postReview({ productId, rating, comment });
      toast.success("Review posted!");
      setShowForm(false);
      setComment("");
    } catch (error) {
      toast.error("Failed to post review");
    }
  };

  if (!reviews) return null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-amber-400 font-bold">★</span>
          <span className="text-sm font-bold text-slate-700">{avgRating || "No reviews"}</span>
          <span className="text-xs text-slate-400">({reviews.length})</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] font-black uppercase text-primary hover:underline"
        >
          {showForm ? "Cancel" : "Write Review"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-3 rounded-xl space-y-3 animate-slide-up">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-xl transition-all ${rating >= star ? "text-amber-400 scale-110" : "text-slate-300"}`}
              >
                ★
              </button>
            ))}
          </div>
          <VoiceInput
            type="textarea"
            value={comment}
            onChange={setComment}
            placeholder="Share your experience..."
            className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <button type="submit" className="w-full py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg shadow-md active:scale-95 transition-all">
            Post Review
          </button>
        </form>
      )}

      {reviews.length > 0 && !showForm && (
        <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
          {reviews.slice(0, 2).map((review) => (
            <div key={review._id} className="text-[10px] bg-slate-50/50 p-2 rounded-lg border border-slate-100">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-slate-700">{review.buyerName}</span>
                <span className="text-amber-400">{"★".repeat(review.rating)}</span>
              </div>
              <p className="text-slate-500 italic">"{review.comment}"</p>
            </div>
          ))}
          {reviews.length > 2 && (
            <p className="text-[9px] text-center text-slate-400 font-medium">+ {reviews.length - 2} more reviews</p>
          )}
        </div>
      )}
    </div>
  );
}
