import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

// Layouts
import PublicLayout from "@/components/layouts/PublicLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// Public Pages
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import EquipmentSearchPage from "@/pages/EquipmentSearchPage";
import EquipmentDetailPage from "@/pages/EquipmentDetailPage";
import PricingPage from "@/pages/PricingPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import SettingsPage from "@/pages/SettingsPage";

// Contractor Pages
import ContractorDashboard from "@/pages/contractor/Dashboard";
import ContractorBookings from "@/pages/contractor/Bookings";
import ContractorBookingConfirmation from "@/pages/contractor/BookingConfirmation";
import ContractorWallet from "@/pages/contractor/Wallet";

// Owner Pages
import OwnerDashboard from "@/pages/owner/Dashboard";
import OwnerEquipment from "@/pages/owner/Equipment";
import OwnerEquipmentNew from "@/pages/owner/EquipmentNew";
import OwnerRequests from "@/pages/owner/Requests";
import OwnerPayouts from "@/pages/owner/Payouts";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminUserDetail from "@/pages/admin/UserDetail";
import AdminListings from "@/pages/admin/Listings";
import AdminListingDetail from "@/pages/admin/ListingDetail";
import AdminBookings from "@/pages/admin/Bookings";
import AdminBookingDetail from "@/pages/admin/BookingDetail";
import AdminDisputes from "@/pages/admin/Disputes";
import AdminReports from "@/pages/admin/Reports";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const initialize = useAuthStore((state) => state.initialize);
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/equipment" element={<EquipmentSearchPage />} />
              <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Route>
            
            {/* Auth Route */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Contractor Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/contractor" element={<ContractorDashboard />} />
              <Route path="/contractor/search" element={<EquipmentSearchPage />} />
              <Route path="/contractor/bookings" element={<ContractorBookings />} />
              <Route path="/contractor/bookings/confirmation/:id" element={<ContractorBookingConfirmation />} />
              <Route path="/contractor/bookings/:id" element={<ContractorBookings />} />
              <Route path="/contractor/wallet" element={<ContractorWallet />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            
            {/* Owner Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/equipment" element={<OwnerEquipment />} />
              <Route path="/owner/equipment/new" element={<OwnerEquipmentNew />} />
              <Route path="/owner/equipment/:id/edit" element={<OwnerEquipmentNew />} />
              <Route path="/owner/requests" element={<OwnerRequests />} />
              <Route path="/owner/payouts" element={<OwnerPayouts />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              <Route path="/admin/listings" element={<AdminListings />} />
              <Route path="/admin/listings/:id" element={<AdminListingDetail />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/bookings/:id" element={<AdminBookingDetail />} />
              <Route path="/admin/disputes" element={<AdminDisputes />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
