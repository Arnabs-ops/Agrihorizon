import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { CommunityHub } from "./CommunityHub";
import { MessagingSystem } from "./MessagingSystem";
import { NotificationCenter } from "./NotificationCenter";
import { MarketPrices } from "./MarketPrices";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { useLanguage } from "./useLanguage";
import sellerBg from "./assets/seller_bg.png";
import { WelcomeModal } from "./WelcomeModal";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { HelpButton } from "./HelpButton";
import { useTutorial } from "./TutorialProvider";

interface UserProfile {
  user: any;
  profile: {
    role: "seller" | "buyer";
    fullName: string;
    phoneNumber?: string;
    location?: string;
    businessName?: string;
    farmSize?: string;
    cropTypes?: string[];
    preferredProducts?: string[];
  } | null;
}

interface SellerDashboardProps {
  userProfile: UserProfile;
}

interface Product {
  _id: Id<"products">;
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
}

interface Order {
  _id: Id<"orders">;
  status: string;
  quantity: number;
  totalAmount: number;
  orderDate: number;
  deliveryAddress?: string;
  product: {
    name: string;
    unit: string;
    imageEmoji: string;
    [key: string]: any;
  } | null;
  buyer: {
    user: any;
    profile: {
      fullName: string;
      businessName?: string;
      [key: string]: any;
    } | null;
  };
}

export function SellerDashboard({ userProfile }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showMessaging, setShowMessaging] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Tutorial state
  const { tutorialProgress } = useTutorial();

  const { t } = useLanguage();

  const { user, profile } = userProfile;
  const sellerProducts: Product[] = (useQuery(api.products.getSellerProducts) as any) || [];
  const sellerOrders: Order[] = (useQuery(api.orders.getSellerOrders) as any) || [];
  const analytics = useQuery(api.orders.getSellerAnalytics);


  const addProduct = useMutation(api.products.addProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);

  if (!profile) {
    return <div>Error: Profile not found</div>;
  }

  const handleProcessOrder = async (orderId: Id<"orders">) => {
    try {
      await updateOrderStatus({ orderId, status: "processing" });
      toast.success("Order status updated to processing");
    } catch (error) {
      toast.error("Failed to update order status");
      console.error(error);
    }
  };

  const handleCompleteOrder = async (orderId: Id<"orders">) => {
    try {
      await updateOrderStatus({ orderId, status: "delivered" });
      toast.success("Order marked as delivered");
    } catch (error) {
      toast.error("Failed to update order status");
      console.error(error);
    }
  };

  const handleDeleteProduct = async (productId: Id<"products">) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteProduct({ productId });
        toast.success(t('productDeleted'));
      } catch (error) {
        toast.error("Failed to delete product");
        console.error(error);
      }
    }
  };

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

  const getProductStatus = (product: any) => {
    if (!product.isActive) return { text: t('cancelled'), color: "bg-red-100 text-red-800" };
    if (product.stockQuantity === 0) return { text: t('outOfStock'), color: "bg-red-100 text-red-800" };
    if (product.stockQuantity < 10) return { text: "lowStock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "active", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="space-y-8 animate-entry">
      {/* Premium Welcome Header */}
      <div className="rounded-2xl p-8 modern-shadow relative min-h-[220px] flex items-center">
        {/* Dynamic Background Image with Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0 z-0 scale-105 animate-slow-zoom"
            style={{
              backgroundImage: `url(${sellerBg})`,
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
              <span className="text-4xl">🚜</span>
            </div>
            <div>
              <p className="text-slate-300 font-bold tracking-widest uppercase text-xs mb-2 drop-shadow-md">{t('sellerTerminal')}</p>
              <h1 className="text-4xl font-black leading-tight drop-shadow-lg mb-3">
                <span className="text-white">{t('welcome')},</span><br />
                <span className="text-primary">{profile.fullName}!</span>
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {profile.businessName && (
                  <span className="flex items-center text-sm font-semibold text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                    🏪 {profile.businessName}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center text-sm font-semibold text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                    📍 {profile.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddProduct(true)}
              data-tour-id="add-product-button"
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <span className="text-xl">+</span> {t('addProduct')}
            </button>
            <NotificationCenter onNavigate={(link) => setActiveTab(link)} />
            <button
              onClick={() => setShowMessaging(true)}
              data-tour-id="messages-button"
              className="group bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-slate-200 active:scale-95"
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
            { id: "products", label: t('inventory'), icon: "🌾" },
            { id: "orders", label: t('myOrders'), icon: "📦" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-tour-id={tab.id === "orders" ? "orders-tab" : undefined}
              className={`flex items-center gap-3 py-3.5 px-6 rounded-2xl font-black text-sm tab-transition flex-1 justify-center ${activeTab === tab.id
                ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]"
                : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
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
              data-tour-id="more-tab"
              className={`w-full flex items-center gap-3 py-3.5 px-6 rounded-2xl font-black text-sm tab-transition justify-center ${["analytics", "prices", "community"].includes(activeTab) || showMoreMenu
                ? "bg-slate-900 text-white shadow-xl"
                : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                }`}
            >
              <span className="text-xl">✨</span>
              <span className="hidden md:inline">More</span>
              <span className={`text-[10px] opacity-50 ml-1 transition-transform ${showMoreMenu ? "rotate-180" : ""}`}>▼</span>
            </button>

            {showMoreMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 animate-scale-up z-50">
                {[
                  { id: "analytics", label: t('analytics'), icon: "📈" },
                  { id: "prices", label: t('marketIntelligence'), icon: "💹" },
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
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
            <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                {t('marketplace')}
              </h3>
              <p className="text-6xl font-black mb-2">{analytics?.totalProducts || 0}</p>
              <p className="text-sm font-bold opacity-70">{t('activeListings')}</p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                {t('pending')}
              </h3>
              <p className="text-6xl font-black mb-2">{analytics?.pendingOrders || 0}</p>
              <p className="text-sm font-bold opacity-70">{t('awaitingFulfillment')}</p>
            </div>

            <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-black/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                {t('monthlyRevenue')}
              </h3>
              <p className="text-4xl font-black mb-2">
                {formatPrice(analytics?.monthlyRevenue || 0)}
              </p>
              <p className="text-sm font-bold opacity-70">{t('thisMonth')}</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                {t('delivered')}
              </h3>
              <p className="text-6xl font-black mb-2">{analytics?.completedOrders || 0}</p>
              <p className="text-sm font-bold opacity-70">{t('allTimeCompletion')}</p>
            </div>
          </div>

          <OnboardingChecklist userRole="seller" />

          {profile.farmSize && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 modern-shadow">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                {t('farmInformation')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('farmSizeLabel')}</p>
                  <p className="font-bold text-slate-900 capitalize text-lg">{profile.farmSize}</p>
                </div>
                {profile.cropTypes && profile.cropTypes.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('cropTypesLabel')}</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.cropTypes.map((crop, index) => (
                        <span
                          key={index}
                          className="bg-primary/5 text-primary px-3 py-1.5 rounded-xl text-sm font-bold border border-primary/10"
                        >
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-2xl border border-slate-100 modern-shadow">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-2 h-8 bg-slate-900 rounded-full"></span>
                {t('recentOrders')}
              </h3>
              <button onClick={() => setActiveTab("orders")} className="text-sm font-bold text-primary hover:underline">{t('viewAllOrders')} →</button>
            </div>
            <div className="space-y-4">
              {sellerOrders.slice(0, 3).map((order) => (
                <div key={order._id} className="flex items-center gap-6 p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                  <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl">
                    {order.product?.imageEmoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-black text-slate-900">{t('orderFrom')} {order.buyer.profile?.fullName}</p>
                        <p className="text-xs font-bold text-slate-500">{order.product?.name} • {order.quantity} {order.product?.unit}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)} shadow-sm`}>
                        {t(order.status as any)}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(order.orderDate)}</p>
                  </div>
                </div>
              ))}
              {sellerOrders?.length === 0 && (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">{t('noOrdersYet') || "No orders yet"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900">{t('inventory')}</h2>
            <button
              onClick={() => setShowAddProduct(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg active:scale-95"
            >
              + {t('addProduct')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellerProducts.map((product) => {
              const status = getProductStatus(product);
              return (
                <div key={product._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl transition-all group modern-shadow">
                  <div className="relative h-48 mb-4 bg-slate-50 rounded-xl overflow-hidden group-hover:shadow-lg transition-all duration-500 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <span className="text-5xl group-hover:scale-120 transition-transform duration-500">{product.imageEmoji}</span>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status.color} shadow-sm backdrop-blur-md bg-white/80`}>
                        {t(status.text.toLowerCase() as any) || status.text}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-1">{product.name}</h3>

                  <div className="space-y-1 mb-3">
                    <p className="text-primary font-black text-xl">
                      {formatPrice(product.price)}<span className="text-sm font-bold text-slate-400">/{product.unit}</span>
                    </p>
                    {product.priceTiers && product.priceTiers.length > 0 && (
                      <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] font-black uppercase text-amber-700 mb-1">{t('tieredPricing')}</p>
                        {product.priceTiers.map((tier, idx) => (
                          <p key={idx} className="text-xs text-amber-800 font-bold">
                            {tier.minQuantity}+ {product.unit}: <span className="text-amber-600">{formatPrice(tier.price)}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-slate-500">{t('stock')}: <span className="text-slate-900">{product.stockQuantity} {product.unit}</span></p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="flex-1 bg-slate-900 text-white py-3 px-4 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm active:scale-95"
                    >
                      {t('update')}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                      title={t('deleteProduct')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {sellerProducts?.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-xl font-bold mb-6">{t('noProductsYet') || "No products yet"}</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
              >
                {t('addProduct')}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900">{t('myOrders')}</h2>
          <div className="space-y-4">
            {sellerOrders.map((order) => (
              <div key={order._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-primary/30 transition-all modern-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                    <div className="text-4xl w-16 h-16 bg-slate-50 flex items-center justify-center rounded-xl">{order.product?.imageEmoji}</div>
                    <div>
                      <h3 className="font-black text-slate-900 text-xl mb-1">
                        {order.product?.name}
                      </h3>
                      <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        👤 {order.buyer.profile?.fullName}
                      </p>
                      <p className="text-sm font-bold text-slate-500 mt-1">
                        📦 {order.quantity} {order.product?.unit}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs font-bold text-slate-400">
                          📅 {formatDate(order.orderDate)}
                        </p>
                        {order.deliveryAddress && (
                          <p className="text-xs font-bold text-primary">
                            📍 {order.deliveryAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-2xl mb-2">
                      {formatPrice(order.totalAmount)}
                    </p>
                    <div className="flex flex-col items-end gap-3">
                      <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)} shadow-sm`}>
                        {t(order.status as any)}
                      </span>

                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleProcessOrder(order._id)}
                            className="bg-amber-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg active:scale-95"
                          >
                            {t('processOrder')}
                          </button>
                        )}
                        {order.status === "processing" && (
                          <button
                            onClick={() => handleCompleteOrder(order._id)}
                            className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                          >
                            {t('markDelivered')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sellerOrders?.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xl font-bold">{t('noOrdersYet') || "No orders yet"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900">{t('analytics')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 modern-shadow">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Top Products
              </h3>
              <div className="space-y-6">
                {analytics?.topProducts?.map((product: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-700">{product.name}</span>
                      <span className="text-primary">{product.sales} {t('delivered')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${product.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )) || (
                    <p className="text-slate-400 text-center py-8 font-medium italic">No sales data yet.</p>
                  )}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-8 modern-shadow relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              <h3 className="text-lg font-black mb-8 relative z-10">{t('monthlyRevenue')}</h3>
              <div className="space-y-8 relative z-10">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <p className="text-4xl font-black text-primary mb-1">
                    {formatPrice(analytics?.monthlyRevenue || 0)}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('monthlyRevenue')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-2xl font-black text-blue-400">{analytics?.completedOrders || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('delivered')}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-2xl font-black text-emerald-400">{analytics?.totalProducts || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('inventory')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "prices" && (
        <MarketPrices userRole="seller" />
      )}

      {activeTab === "community" && (
        <CommunityHub />
      )}

      {/* Tutorial Components */}
      {!tutorialProgress?.hasSeenWelcome && (
        <WelcomeModal
          userRole="seller"
          onComplete={() => { }}
        />
      )}

      <HelpButton />

      {/* Add/Edit Product Modal */}
      {(showAddProduct || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowAddProduct(false);
            setEditingProduct(null);
          }}
          onSave={async (productData) => {
            try {
              if (editingProduct) {
                await updateProduct({ productId: editingProduct._id, ...productData });
                toast.success("Product updated successfully!");
              } else {
                await addProduct(productData);
                toast.success("Product added successfully!");
              }
              setShowAddProduct(false);
              setEditingProduct(null);
            } catch (error) {
              toast.error("Failed to save product");
              console.error(error);
            }
          }}
        />
      )}

      {/* Messaging System */}
      {showMessaging && (
        <MessagingSystem onClose={() => setShowMessaging(false)} />
      )}
    </div>
  );
}

// Product Modal Component
function ProductModal({ product, onClose, onSave }: {
  product?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    unit: product?.unit || "kg",
    category: product?.category || "vegetables",
    stockQuantity: product?.stockQuantity || 0,
    imageEmoji: product?.imageEmoji || "🥬",
    imageStorageId: product?.imageStorageId || undefined,
    priceTiers: product?.priceTiers || [],
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl || null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      setFormData(prev => ({ ...prev, imageStorageId: storageId }));
      setPreviewUrl(URL.createObjectURL(file));
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Upload failed");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addTier = () => {
    setFormData(prev => ({
      ...prev,
      priceTiers: [...prev.priceTiers, { minQuantity: 0, price: 0 }]
    }));
  };

  const removeTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      priceTiers: prev.priceTiers.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateTier = (index: number, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      priceTiers: prev.priceTiers.map((tier: any, i: number) =>
        i === index ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const categories = ["vegetables", "fruits", "grains", "dairy", "herbs", "nuts"];
  const units = ["lb", "kg", "dozen", "head", "bunch", "bag", "box"];
  const emojis = ["🍅", "🥬", "🥕", "🌽", "🍎", "🍊", "🥚", "🥛", "🌾", "🥜"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <span className="text-3xl">📦</span>
          {product ? t('editProduct') : t('addProduct')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                {t('productName')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                {t('basePrice')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                {t('unit')}
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-slate-700"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                {t('category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-slate-700"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                {t('stock')}
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-amber-900 font-bold uppercase tracking-wider text-sm">{t('tieredPricing')}</h4>
                <p className="text-xs text-amber-700 font-medium">Add discounts for larger quantities</p>
              </div>
              <button
                type="button"
                onClick={addTier}
                className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm"
              >
                + {t('addTier')}
              </button>
            </div>

            <div className="space-y-3">
              {formData.priceTiers.map((tier: any, index: number) => (
                <div key={index} className="flex items-center gap-3 animate-fade-in">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">MIN. QTY</span>
                      <input
                        type="number"
                        placeholder="Min Qty"
                        value={tier.minQuantity}
                        onChange={(e) => updateTier(index, 'minQuantity', parseInt(e.target.value) || 0)}
                        className="w-full pl-3 pr-16 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Tier Price"
                        value={tier.price}
                        onChange={(e) => updateTier(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTier(index)}
                    className="text-amber-500 hover:text-red-500 p-2 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {formData.priceTiers.length === 0 && (
                <p className="text-center text-amber-600/60 text-xs italic font-medium py-2">No discount tiers added yet</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
              {t('productImage')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-primary/50 transition-all group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label htmlFor="product-image-upload" className="cursor-pointer block">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-bold text-slate-500">Uploading...</p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">📸</span>
                        <p className="text-xs font-bold text-slate-500">{t('uploadPhoto') || "Upload Real Photo"}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Recommended: 800x600px</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Or choose an emoji icon</p>
                  <div className="flex flex-wrap gap-2">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageEmoji: emoji }))}
                        className={`text-xl p-2 w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all active:scale-95 ${formData.imageEmoji === emoji && !formData.imageStorageId
                          ? "bg-white border-primary shadow-md scale-105"
                          : "border-transparent bg-white/50 hover:bg-white"
                          }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
                    {formData.imageEmoji}
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase">Preview</div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => { setPreviewUrl(null); setFormData(prev => ({ ...prev, imageStorageId: undefined })); }}
                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
              {t('description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
              rows={3}
              placeholder="Tell buyers about your harvest..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-primary text-white rounded-xl font-black text-lg shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
            >
              {product ? t('update') : t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
