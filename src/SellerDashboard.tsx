import { useState, useCallback } from "react";
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
import { HelpButton } from "./HelpButton";
import { useTutorial } from "./TutorialProvider";
import { SellerDashboardProps, Product, Order, AnalyticsData } from "./types/seller";
import { SellerOverview } from "./components/seller/SellerOverview";
import { SellerInventory } from "./components/seller/SellerInventory";
import { SellerOrders } from "./components/seller/SellerOrders";
import { SellerAnalytics } from "./components/seller/SellerAnalytics";
import { ProductModal } from "./components/seller/ProductModal";

export function SellerDashboard({ userProfile }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showMessaging, setShowMessaging] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Tutorial state
  const { tutorialProgress } = useTutorial();

  const { t } = useLanguage();

  const { profile } = userProfile;
  const sellerProducts: Product[] = (useQuery(api.products.getSellerProducts) as any) || [];
  const sellerOrders: Order[] = (useQuery(api.orders.getSellerOrders) as any) || [];
  const analytics: AnalyticsData | undefined = useQuery(api.orders.getSellerAnalytics) as any;


  const addProduct = useMutation(api.products.addProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);

  if (!profile) {
    return <div>Error: Profile not found</div>;
  }

  const handleProcessOrder = useCallback(async (orderId: Id<"orders">) => {
    try {
      await updateOrderStatus({ orderId, status: "processing" });
      toast.success("Order status updated to processing");
    } catch (error) {
      toast.error("Failed to update order status");
      console.error(error);
    }
  }, [updateOrderStatus]);

  const handleCompleteOrder = useCallback(async (orderId: Id<"orders">) => {
    try {
      await updateOrderStatus({ orderId, status: "delivered" });
      toast.success("Order marked as delivered");
    } catch (error) {
      toast.error("Failed to update order status");
      console.error(error);
    }
  }, [updateOrderStatus]);

  const handleDeleteProduct = useCallback(async (productId: Id<"products">) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteProduct({ productId });
        toast.success(t('productDeleted'));
      } catch (error) {
        toast.error("Failed to delete product");
        console.error(error);
      }
    }
  }, [deleteProduct, t]);

  const handleAddProduct = useCallback(() => setShowAddProduct(true), []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }, []);

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

      {activeTab === "overview" && analytics && (
        <SellerOverview
          analytics={analytics}
          profile={profile}
          sellerOrders={sellerOrders}
          setActiveTab={setActiveTab}
          formatPrice={formatPrice}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {activeTab === "products" && (
        <SellerInventory
          sellerProducts={sellerProducts}
          onAddProduct={handleAddProduct}
          onEditProduct={setEditingProduct}
          onDeleteProduct={handleDeleteProduct}
          formatPrice={formatPrice}
        />
      )}

      {activeTab === "orders" && (
        <SellerOrders
          sellerOrders={sellerOrders}
          onProcessOrder={handleProcessOrder}
          onCompleteOrder={handleCompleteOrder}
          formatPrice={formatPrice}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {activeTab === "analytics" && analytics && (
        <SellerAnalytics
          analytics={analytics}
          formatPrice={formatPrice}
        />
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
