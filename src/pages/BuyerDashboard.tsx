import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MessagingSystem } from "../components/layout/MessagingSystem";
import { MarketPrices } from "./MarketPrices";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { CommunityHub } from "./CommunityHub";
import { useLanguage } from "../context/LanguageContext";
import { WelcomeModal } from "../components/auth/WelcomeModal";
import { HelpButton } from "../components/layout/HelpButton";
import { useTutorial } from "../components/onboarding/TutorialProvider";
import { useFormatters } from "../hooks/useFormatters";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { OrderStatus } from "../lib/constants";
import type { UserProfile, ProductWithSeller, OrderWithDetails } from "../types";

// Modular Components
import { BuyerHeader } from "../components/buyer/BuyerHeader";
import { MarketplaceView } from "../components/buyer/MarketplaceView";
import { OrdersView } from "../components/buyer/OrdersView";
import { DashboardModals } from "../components/buyer/DashboardModals";
import { SellerPortfolioModal } from "../components/buyer/SellerPortfolioModal";

interface BuyerDashboardProps {
  userProfile: UserProfile;
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
  const [viewingSellerId, setViewingSellerId] = useState<Id<"users"> | null>(null);

  const { tutorialProgress } = useTutorial();
  const { t } = useLanguage();
  const { formatPrice, formatDate, getStatusColor } = useFormatters();
  const { handleError, handleSuccess } = useErrorHandler();

  const { profile } = userProfile;
  const marketplaceProducts = (useQuery(api.products.getMarketplaceProducts) || []) as ProductWithSeller[];
  const allOrders = (useQuery(api.orders.getBuyerOrders) || []) as OrderWithDetails[];
  const createOrder = useMutation(api.orders.createOrder);
  const deleteOrder = useMutation(api.orders.deleteOrder);
  const updateProfile = useMutation(api.users.createUserProfile);

  const cartItems = useMemo(() => allOrders.filter((o) => o.isPaid === false), [allOrders]);
  const buyerOrders = useMemo(() => allOrders.filter((o) => o.isPaid === true || o.isPaid === undefined), [allOrders]);

  if (!profile) {
    return <div>Error: Profile not found</div>;
  }

  const filteredProducts = marketplaceProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seller.profile?.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(marketplaceProducts.map(p => p.category))];

  const activeOrders = buyerOrders.filter(order =>
    order.status === OrderStatus.PENDING ||
    order.status === OrderStatus.PROCESSING ||
    order.status === OrderStatus.SHIPPED
  ).length;

  const handleCreateOrder = async (productId: Id<"products">, sellerId: Id<"users">) => {
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

      handleSuccess(t('addedToCart') || "Added to cart successfully!");
      setOrderQuantities(prev => ({ ...prev, [productId]: 1 }));
    } catch (error) {
      handleError(error, t('addToCartFailed') || "Failed to add to cart.");
    }
  };

  const handleRemoveFromCart = async (orderId: Id<"orders">) => {
    try {
      await deleteOrder({ orderId });
      handleSuccess(t('removedFromCart') || "Item removed from cart");
    } catch (error) {
      handleError(error, t('removeFailed') || "Failed to remove item");
    }
  };

  const handleUpdateAddress = async () => {
    if (!newAddress.trim()) {
      toast.error(t('addressRequired') || "Please enter a valid address");
      return;
    }

    try {
      await updateProfile({
        role: "buyer",
        fullName: profile.fullName,
        location: newAddress,
      });
      handleSuccess(t('addressUpdated') || "Address updated!");

      const addr = newAddress;
      setShowAddressModal(false);
      setNewAddress("");

      if (pendingOrder) {
        const quantity = orderQuantities[pendingOrder.productId] || 1;
        await createOrder({
          productId: pendingOrder.productId,
          quantity,
          deliveryAddress: addr,
        });
        handleSuccess(t('addedToCart') || "Added to cart successfully!");
        setOrderQuantities(prev => ({ ...prev, [pendingOrder.productId]: 1 }));
        setPendingOrder(null);
      }
    } catch (error) {
      handleError(error, t('addressUpdateFailed') || "Failed to update address");
    }
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      let unitPrice = item.unitPrice || 0;
      const product = marketplaceProducts.find(p => p._id === item.productId);
      if (product?.priceTiers && product.priceTiers.length > 0) {
        const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
        const tier = sortedTiers.find(t => item.quantity >= t.minQuantity);
        if (tier) unitPrice = tier.price;
      }
      return sum + (unitPrice * item.quantity);
    }, 0);
  }, [cartItems, marketplaceProducts]);

  return (
    <div className="space-y-8 animate-entry">
      <BuyerHeader
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItemsCount={cartItems.length}
        setShowCart={setShowCart}
        setShowMessaging={setShowMessaging}
        showMoreMenu={showMoreMenu}
        setShowMoreMenu={setShowMoreMenu}
      />

      {(activeTab === "overview" || activeTab === "orders") && (
        <OrdersView
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={profile}
          marketplaceProducts={marketplaceProducts}
          activeOrders={activeOrders}
          buyerOrders={buyerOrders}
          formatPrice={formatPrice}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {activeTab === "marketplace" && (
        <MarketplaceView
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          filteredProducts={filteredProducts}
          orderQuantities={orderQuantities}
          setOrderQuantities={setOrderQuantities}
          handleCreateOrder={handleCreateOrder}
          setViewingSellerId={setViewingSellerId}
          formatPrice={formatPrice}
        />
      )}

      {activeTab === "prices" && <MarketPrices userRole="buyer" />}
      {activeTab === "community" && <CommunityHub />}

      <DashboardModals
        showCart={showCart}
        setShowCart={setShowCart}
        showPayment={showPayment}
        setShowPayment={setShowPayment}
        showAddressModal={showAddressModal}
        setShowAddressModal={setShowAddressModal}
        showMessaging={showMessaging}
        setShowMessaging={setShowMessaging}
        cartItems={cartItems}
        cartTotal={cartTotal}
        newAddress={newAddress}
        setNewAddress={setNewAddress}
        handleRemoveFromCart={handleRemoveFromCart}
        handleUpdateAddress={handleUpdateAddress}
        formatPrice={formatPrice}
      />

      <SellerPortfolioModal
        sellerId={viewingSellerId}
        onClose={() => setViewingSellerId(null)}
      />

      {!tutorialProgress?.hasSeenWelcome && (
        <WelcomeModal
          userRole="buyer"
          onComplete={() => { }}
        />
      )}

      <HelpButton />
    </div>
  );
}
