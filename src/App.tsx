import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ProfileSetup } from "./ProfileSetup";
import { BuyerDashboard } from "./BuyerDashboard";
import { SellerDashboard } from "./SellerDashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm h-16 flex justify-between items-center border-b border-green-200 shadow-sm px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">🌾</span>
          </div>
          <h2 className="text-xl font-bold text-green-800">AgroHorizon</h2>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  if (userProfile === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Unauthenticated>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-green-800 mb-4">
            Welcome to AgroHorizon
          </h1>
          <p className="text-xl text-green-700 mb-2">
            Connecting Farmers and Buyers in the Agricultural Marketplace
          </p>
          <p className="text-lg text-green-600">
            Sign in to access your personalized dashboard
          </p>
        </div>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        {userProfile && !userProfile.profile ? (
          <ProfileSetup />
        ) : userProfile?.profile?.role === "buyer" ? (
          <BuyerDashboard userProfile={userProfile} />
        ) : userProfile?.profile?.role === "seller" ? (
          <SellerDashboard userProfile={userProfile} />
        ) : (
          <div className="text-center">
            <p className="text-red-600">Error: Invalid user role</p>
          </div>
        )}
      </Authenticated>
    </div>
  );
}
