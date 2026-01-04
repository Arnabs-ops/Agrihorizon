import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { useLanguage } from "./useLanguage";

export function ProfileSetup() {
  const [role, setRole] = useState<"seller" | "buyer" | "">("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [cropTypes, setCropTypes] = useState<string[]>([]);
  const [preferredProducts, setPreferredProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProfile = useMutation(api.users.createUserProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !fullName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile({
        role: role as "seller" | "buyer",
        fullName,
        phoneNumber: phoneNumber || undefined,
        location: location || undefined,
        businessName: role === "seller" ? businessName || undefined : undefined,
        farmSize: role === "seller" ? farmSize || undefined : undefined,
        cropTypes: role === "seller" && cropTypes.length > 0 ? cropTypes : undefined,
        preferredProducts: role === "buyer" && preferredProducts.length > 0 ? preferredProducts : undefined,
      });
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCropTypesChange = (value: string) => {
    const crops = value.split(",").map(crop => crop.trim()).filter(crop => crop);
    setCropTypes(crops);
  };

  const handlePreferredProductsChange = (value: string) => {
    const products = value.split(",").map(product => product.trim()).filter(product => product);
    setPreferredProducts(products);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-green-800 mb-2">Complete Your Profile</h2>
        <p className="text-green-600">Tell us about yourself to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a: <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`p-4 border-2 rounded-lg text-center transition-all ${role === "seller"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-green-300"
                }`}
            >
              <div className="text-2xl mb-2">🚜</div>
              <div className="font-semibold">Seller/Farmer</div>
              <div className="text-sm text-gray-600">I want to sell agricultural products</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`p-4 border-2 rounded-lg text-center transition-all ${role === "buyer"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-green-300"
                }`}
            >
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-semibold">Buyer</div>
              <div className="text-sm text-gray-600">I want to buy agricultural products</div>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="City, State/Province, Country"
          />
        </div>

        {/* Seller-specific fields */}
        {role === "seller" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business/Farm Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your farm or business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Size
                </label>
                <select
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select farm size</option>
                  <option value="small">Small (&lt; 5 acres)</option>
                  <option value="medium">Medium (5-50 acres)</option>
                  <option value="large">Large (50-500 acres)</option>
                  <option value="commercial">Commercial (&gt; 500 acres)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Types (comma-separated)
              </label>
              <input
                type="text"
                onChange={(e) => handleCropTypesChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Wheat, Corn, Tomatoes, Apples"
              />
            </div>
          </>
        )}

        {/* Buyer-specific fields */}
        {role === "buyer" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Products (comma-separated)
            </label>
            <input
              type="text"
              onChange={(e) => handlePreferredProductsChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Organic Vegetables, Fresh Fruits, Grains"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !role || !fullName}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating Profile..." : "Complete Setup"}
        </button>
      </form>
    </div>
  );
}
