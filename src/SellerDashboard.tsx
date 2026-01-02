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

interface SellerDashboardProps {
  userProfile: UserProfile;
}

export function SellerDashboard({ userProfile }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showMessaging, setShowMessaging] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const { user, profile } = userProfile;
  const sellerProducts = useQuery(api.products.getSellerProducts) || [];
  const sellerOrders = useQuery(api.orders.getSellerOrders) || [];
  const analytics = useQuery(api.orders.getSellerAnalytics);
  
  const addProduct = useMutation(api.products.addProduct);
  const updateProduct = useMutation(api.products.updateProduct);
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

  const getProductStatus = (product: any) => {
    if (!product.isActive) return { text: "Inactive", color: "bg-red-100 text-red-800" };
    if (product.stockQuantity === 0) return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (product.stockQuantity < 10) return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Active", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚜</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome, {profile.fullName}!
              </h1>
              <p className="text-gray-600">Seller Dashboard - Manage your agricultural business</p>
              {profile.businessName && (
                <p className="text-sm text-gray-500">🏢 {profile.businessName}</p>
              )}
              {profile.location && (
                <p className="text-sm text-gray-500">📍 {profile.location}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowMessaging(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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
              { id: "products", label: "My Products", icon: "🌾" },
              { id: "orders", label: "Orders", icon: "📦" },
              { id: "analytics", label: "Analytics", icon: "📈" },
              { id: "prices", label: "Market Prices", icon: "💹" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Total Products
                  </h3>
                  <p className="text-3xl font-bold text-green-600">{analytics?.totalProducts || 0}</p>
                  <p className="text-sm text-green-600">Active listings</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Pending Orders
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">{analytics?.pendingOrders || 0}</p>
                  <p className="text-sm text-blue-600">Awaiting fulfillment</p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Monthly Revenue
                  </h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    {formatPrice(analytics?.monthlyRevenue || 0)}
                  </p>
                  <p className="text-sm text-yellow-600">This month</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">
                    Completed Orders
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">{analytics?.completedOrders || 0}</p>
                  <p className="text-sm text-purple-600">All time</p>
                </div>
              </div>

              {profile.farmSize && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Farm Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Farm Size</p>
                      <p className="font-semibold capitalize">{profile.farmSize}</p>
                    </div>
                    {profile.cropTypes && profile.cropTypes.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Crop Types</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.cropTypes.map((crop, index) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
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

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Orders
                </h3>
                <div className="space-y-3">
                  {sellerOrders.slice(0, 3).map((order) => (
                    <div key={order._id} className="flex items-center gap-3 p-3 bg-white rounded">
                      <span className="text-2xl">{order.product?.imageEmoji}</span>
                      <div className="flex-1">
                        <span className="font-medium">
                          Order from {order.buyer.profile?.fullName}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {order.product?.name} - {order.quantity} {order.product?.unit}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(order.orderDate)}</span>
                    </div>
                  ))}
                  {sellerOrders.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No orders yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">My Products</h2>
                <button 
                  onClick={() => setShowAddProduct(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Add New Product
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerProducts.map((product) => {
                  const status = getProductStatus(product);
                  return (
                    <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-4xl text-center mb-3">{product.imageEmoji}</div>
                      <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                      <p className="text-green-600 font-bold mb-1">
                        {formatPrice(product.price)}/{product.unit}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">Stock: {product.stockQuantity} {product.unit}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mb-3 ${status.color}`}>
                        {status.text}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                          📊
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sellerProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">You haven't added any products yet.</p>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Your First Product
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
              <div className="space-y-4">
                {sellerOrders.map((order) => (
                  <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{order.product?.imageEmoji}</div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {order.product?.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Customer: {order.buyer.profile?.fullName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity: {order.quantity} {order.product?.unit}
                          </p>
                          <p className="text-sm text-gray-600">
                            Order Date: {formatDate(order.orderDate)}
                          </p>
                          {order.deliveryAddress && (
                            <p className="text-sm text-gray-600">
                              Delivery: {order.deliveryAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800 text-lg mb-2">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm mb-2 ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <div className="flex gap-2">
                          {order.status === "pending" && (
                            <button 
                              onClick={() => handleProcessOrder(order._id)}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                            >
                              Process Order
                            </button>
                          )}
                          {order.status === "processing" && (
                            <button 
                              onClick={() => handleCompleteOrder(order._id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {sellerOrders.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No orders received yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
                  <div className="space-y-3">
                    {analytics?.topProducts?.map((product, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{product.name}</span>
                          <span>{product.sales} sold</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${product.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">No sales data yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Performance</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {formatPrice(analytics?.monthlyRevenue || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{analytics?.completedOrders || 0}</p>
                      <p className="text-sm text-gray-600">Orders Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">{analytics?.activeProducts || 0}</p>
                      <p className="text-sm text-gray-600">Active Products</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "prices" && (
            <MarketPrices userRole="seller" />
          )}
        </div>
      </div>

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
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    unit: product?.unit || "lb",
    category: product?.category || "vegetables",
    stockQuantity: product?.stockQuantity || 0,
    imageEmoji: product?.imageEmoji || "🥬",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const categories = ["vegetables", "fruits", "grains", "dairy", "herbs", "nuts"];
  const units = ["lb", "kg", "dozen", "head", "bunch", "bag", "box"];
  const emojis = ["🍅", "🥬", "🥕", "🌽", "🍎", "🍊", "🥚", "🥛", "🌾", "🥜"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {product ? "Edit Product" : "Add New Product"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image (Emoji)
            </label>
            <div className="flex gap-2 mb-2">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, imageEmoji: emoji }))}
                  className={`text-2xl p-2 rounded ${
                    formData.imageEmoji === emoji ? "bg-green-100" : "hover:bg-gray-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {product ? "Update" : "Add"} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
