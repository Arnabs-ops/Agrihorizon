import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CommunityHub } from "./CommunityHub";
import { MessagingSystem } from "../components/layout/MessagingSystem";
import { NotificationCenter } from "../components/layout/NotificationCenter";
import { MarketPrices } from "./MarketPrices";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useLanguage } from "../context/LanguageContext";
import { WelcomeModal } from "../components/auth/WelcomeModal";
import { SellerHeader } from "../components/seller/SellerHeader";
import { SellerNavigation } from "../components/seller/SellerNavigation";
import { HelpButton } from "../components/layout/HelpButton";
import { useTutorial } from "../components/onboarding/TutorialProvider";
import { useFormatters } from "../hooks/useFormatters";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { OrderStatus } from "../lib/constants";
import type { SellerDashboardProps, Product, OrderWithDetails, AnalyticsData } from "../types";
import { SellerOverview } from "../components/seller/SellerOverview";
import { SellerInventory } from "../components/seller/SellerInventory";
import { SellerOrders } from "../components/seller/SellerOrders";
import { SellerAnalytics } from "../components/seller/SellerAnalytics";
import { ProductModal } from "../components/seller/ProductModal";
import { CropAdvisor } from "../components/seller/CropAdvisor";
import { FarmPortfolio } from "../components/seller/FarmPortfolio";
import { PaymentSettings } from "../components/seller/PaymentSettings";

export function SellerDashboard({ userProfile }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showMessaging, setShowMessaging] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Tutorial state
  const { tutorialProgress } = useTutorial();

  const { t } = useLanguage();
  const { formatPrice, formatDate, getStatusColor } = useFormatters();
  const { handleError, handleSuccess } = useErrorHandler();

  const { profile } = userProfile;
  const sellerProducts = (useQuery(api.products.getSellerProducts) || []) as Product[];
  const sellerOrders = (useQuery(api.orders.getSellerOrders) || []) as OrderWithDetails[];
  const analytics = useQuery(api.orders.getSellerAnalytics) as AnalyticsData | undefined;


  const addProduct = useMutation(api.products.addProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);

  if (!profile) {
    return <div>Error: Profile not found</div>;
  }

  const handleProcessOrder = useCallback(async (orderId: Id<"orders">) => {
    try {
      await updateOrderStatus({ orderId, status: OrderStatus.PROCESSING });
      handleSuccess(t('orderStatusUpdated') || "Order status updated to processing");
    } catch (error) {
      handleError(error, t('orderStatusUpdateFailed') || "Failed to update order status");
    }
  }, [updateOrderStatus, handleSuccess, handleError, t]);

  const handleCompleteOrder = useCallback(async (orderId: Id<"orders">) => {
    try {
      await updateOrderStatus({ orderId, status: OrderStatus.DELIVERED });
      handleSuccess(t('orderMarkedDelivered') || "Order marked as delivered");
    } catch (error) {
      handleError(error, t('orderStatusUpdateFailed') || "Failed to update order status");
    }
  }, [updateOrderStatus, handleSuccess, handleError, t]);

  const handleDeleteProduct = useCallback(async (productId: Id<"products">) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteProduct({ productId });
        handleSuccess(t('productDeleted') || "Product deleted successfully");
      } catch (error) {
        handleError(error, t('productDeleteFailed') || "Failed to delete product");
      }
    }
  }, [deleteProduct, handleSuccess, handleError, t]);

  const handleAddProduct = useCallback(() => setShowAddProduct(true), []);

  return (
    <div className="space-y-8 animate-entry">
      <SellerHeader
        profile={profile}
        setShowAddProduct={setShowAddProduct}
        setShowMessaging={setShowMessaging}
        setActiveTab={setActiveTab}
      />

      <SellerNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showMoreMenu={showMoreMenu}
        setShowMoreMenu={setShowMoreMenu}
      />

      {activeTab === "overview" && analytics && (
        <SellerOverview
          analytics={analytics}
          profile={profile}
          sellerOrders={sellerOrders}
          setActiveTab={setActiveTab}
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
        />
      )}

      {activeTab === "analytics" && (
        <SellerAnalytics />
      )}

      {activeTab === "prices" && (
        <MarketPrices userRole="seller" />
      )}

      {activeTab === "community" && (
        <CommunityHub />
      )}

      {activeTab === "advisory" && (
        <CropAdvisor
          location={profile.location || t('enterLocation')}
          crops={profile.cropTypes || []}
        />
      )}

      {activeTab === "portfolio" && (
        <FarmPortfolio userProfile={userProfile} />
      )}

      {activeTab === "settings" && (
        <PaymentSettings />
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
                handleSuccess(t('productUpdated') || "Product updated successfully!");
              } else {
                await addProduct(productData);
                handleSuccess(t('productAdded') || "Product added successfully!");
              }
              setShowAddProduct(false);
              setEditingProduct(null);
            } catch (error) {
              handleError(error, t('productSaveFailed') || "Failed to save product");
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
