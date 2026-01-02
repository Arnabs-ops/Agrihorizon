import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { MessagingSystem } from "./MessagingSystem";
import { MarketPrices } from "./MarketPrices";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

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

interface BuyerDashboardProps {
  userProfile: UserProfile;
}

export function BuyerDashboard({ userProfile }: BuyerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showMessaging, setShowMessaging] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});

  const { user, profile } = userProfile;
  const marketplaceProducts = useQuery(api.products.getMarketplaceProducts) || [];
  const buyerOrders = useQuery(api.orders.getBuyerOrders) || [];
  const createOrder = useMutation(api.orders.createOrder);

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
    const quantity = orderQuantities[productId] || 1;
    
    try {
      await createOrder({
        productId,
        quantity,
        deliveryAddress: profile.location,
      });
      
      toast.success("Order placed successfully!");
      setOrderQuantities(prev => ({ ...prev, [productId]: 1 }));
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
      console.error(error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome, {profile.fullName}!
              </h1>
              <p className="text-gray-600">Buyer Dashboard - Find the best agricultural products</p>
              {profile.location && (
                <p className="text-sm text-gray-500">📍 {profile.location}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowMessaging(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            💬 Messages
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "marketplace", label: "Marketplace", icon: "🏪" },
              { id: "orders", label: "My Orders", icon: "📦" },
              { id: "prices", label: "Best Deals", icon: "💰" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Available Products
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">{marketplaceProducts.length}</p>
                  <p className="text-sm text-blue-600">Fresh products available</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Active Orders
                  </h3>
                  <p className="text-3xl font-bold text-green-600">{activeOrders}</p>
                  <p className="text-sm text-green-600">Orders in progress</p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Total Orders
                  </h3>
                  <p className="text-3xl font-bold text-yellow-600">{buyerOrders.length}</p>
                  <p className="text-sm text-yellow-600">All time orders</p>
                </div>
              </div>

              {profile.preferredProducts && profile.preferredProducts.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Your Preferred Products
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferredProducts.map((product, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Orders
                </h3>
                <div className="space-y-3">
                  {buyerOrders.slice(0, 3).map((order) => (
                    <div key={order._id} className="flex items-center gap-3 p-3 bg-white rounded">
                      <span className="text-2xl">{order.product?.imageEmoji}</span>
                      <div className="flex-1">
                        <span className="font-medium">{order.product?.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {order.quantity} {order.product?.unit} - {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(order.orderDate)}</span>
                    </div>
                  ))}
                  {buyerOrders.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No orders yet. Start shopping!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "marketplace" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Marketplace</h2>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
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
                  <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="text-4xl text-center mb-3">{product.imageEmoji}</div>
                    <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                    <p className="text-blue-600 font-bold mb-1">
                      {formatPrice(product.price)}/{product.unit}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      by {product.seller.profile?.businessName || product.seller.profile?.fullName}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      Stock: {product.stockQuantity} {product.unit}
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
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.stockQuantity === 0 ? "Out of Stock" : "Order Now"}
                      </button>
                      <button 
                        onClick={() => setShowMessaging(true)}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Contact seller"
                      >
                        💬
                      </button>
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
              <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
              <div className="space-y-4">
                {buyerOrders.map((order) => (
                  <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{order.product?.imageEmoji}</div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{order.product?.name}</h3>
                          <p className="text-sm text-gray-600">
                            Seller: {order.seller.profile?.businessName || order.seller.profile?.fullName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity: {order.quantity} {order.product?.unit}
                          </p>
                          <p className="text-sm text-gray-600">
                            Order Date: {formatDate(order.orderDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800 text-lg">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {buyerOrders.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">You haven't placed any orders yet.</p>
                    <button
                      onClick={() => setActiveTab("marketplace")}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "prices" && (
            <MarketPrices userRole="buyer" />
          )}
        </div>
      </div>

      {/* Messaging System */}
      {showMessaging && (
        <MessagingSystem onClose={() => setShowMessaging(false)} />
      )}
    </div>
  );
}
