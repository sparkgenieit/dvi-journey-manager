// FILE: src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  Outlet,
} from "react-router-dom";
import DynamicMeta from "@/components/DynamicMeta";
import { getToken } from "@/lib/api";

import { MainLayout } from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import { CreateItinerary } from "./pages/CreateItinerary/CreateItinerary";
import { LatestItinerary } from "./pages/LatestItinerary";
import { AccountsManager } from "./pages/accounts/AccountsManager";
import "./App.css";
import NotFound from "./pages/NotFound";
import { AccountsLedger } from "./pages/accounts/AccountsLedger";
import Hotels from "./pages/Hotels";
import Login from "./pages/Login";
import HotelForm from "./pages/HotelForm";
import { DailyMomentTracker } from "./pages/daily-moment-tracker/DailyMomentTracker";
import DailyMomentDayView from "./pages/daily-moment-tracker/DailyMomentDayView";
import VendorsPage from "./pages/vendor/VendorsPage";
import VendorFormPage from "./pages/vendor/VendorFormPage";
import { ItineraryDetails } from "./pages/ItineraryDetails";

// ── Deep-link helpers: /hotels/:id/<tab> → /hotels/:id/edit?tab=<tab> ──
const RoomsRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/hotels/${id}/edit?tab=rooms`} replace />;
};
const AmenitiesRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/hotels/${id}/edit?tab=amenities`} replace />;
};
const PriceBookRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/hotels/${id}/edit?tab=pricebook`} replace />;
};
const ReviewsRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/hotels/${id}/edit?tab=reviews`} replace />;
};
const PreviewRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/hotels/${id}/edit?tab=preview`} replace />;
};

/**
 * Auth guard: blocks all protected routes when no token is present.
 * Uses the same accessToken that auth.ts stores via setToken().
 */
const RequireAuth = () => {
  const token = getToken();
  if (!token) {
    // Not logged in → send to /login
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DynamicMeta />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* All routes below require auth */}
          <Route element={<RequireAuth />}>
            <Route
              path="/"
              element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              }
            />

            <Route
              path="/create-itinerary"
              element={
                <MainLayout>
                  <CreateItinerary />
                </MainLayout>
              }
            />
            <Route
              path="/latest-itinerary"
              element={
                <MainLayout>
                  <LatestItinerary />
                </MainLayout>
              }
            />
            <Route
              path="/itinerary-details/:id"
              element={
                <MainLayout>
                  <ItineraryDetails />
                </MainLayout>
              }
            />
            <Route
              path="/accounts-manager"
              element={
                <MainLayout>
                  <AccountsManager />
                </MainLayout>
              }
            />
            <Route
              path="/accounts-ledger"
              element={
                <MainLayout>
                  <AccountsLedger />
                </MainLayout>
              }
            />

            {/* Daily Moment Tracker – main list */}
            <Route
              path="/daily-moment-tracker"
              element={
                <MainLayout>
                  <DailyMomentTracker />
                </MainLayout>
              }
            />
            {/* Daily Moment Tracker – alias to match sidebar link /daily-moment */}
            <Route
              path="/daily-moment"
              element={
                <MainLayout>
                  <DailyMomentTracker />
                </MainLayout>
              }
            />
            {/* Daily Moment Day View – opened from car icon */}
            <Route
              path="/daily-moment/day-view/:planId/:routeId"
              element={
                <MainLayout>
                  <DailyMomentDayView />
                </MainLayout>
              }
            />

            {/* Hotels */}
            <Route
              path="/hotels"
              element={
                <MainLayout>
                  <Hotels />
                </MainLayout>
              }
            />

            {/* Create */}
            <Route
              path="/hotels/new"
              element={
                <MainLayout>
                  <HotelForm />
                </MainLayout>
              }
            />

            {/* Edit (primary) */}
            <Route
              path="/hotels/:id/edit"
              element={
                <MainLayout>
                  <HotelForm />
                </MainLayout>
              }
            />

            {/* Edit (alias): allow /hotels/:id to open the same form */}
            <Route
              path="/hotels/:id"
              element={
                <MainLayout>
                  <HotelForm />
                </MainLayout>
              }
            />
            {/* Deep-links for each step */}
            <Route path="/hotels/:id/rooms" element={<RoomsRedirect />} />
            <Route path="/hotels/:id/amenities" element={<AmenitiesRedirect />} />
            <Route path="/hotels/:id/pricebook" element={<PriceBookRedirect />} />
            <Route path="/hotels/:id/reviews" element={<ReviewsRedirect />} />
            <Route path="/hotels/:id/preview" element={<PreviewRedirect />} />

            {/* Vendor List */}
            <Route
              path="/vendor"
              element={
                <MainLayout>
                  <VendorsPage />
                </MainLayout>
              }
            />

            {/* Add Vendor (6-step wizard) */}
            <Route
              path="/vendor/new"
              element={
                <MainLayout>
                  <VendorFormPage />
                </MainLayout>
              }
            />

            {/* Edit Vendor (primary) */}
            <Route
              path="/vendor/:id"
              element={
                <MainLayout>
                  <VendorFormPage />
                </MainLayout>
              }
            />

            {/* Edit Vendor (alias like PHP if needed) */}
            <Route
              path="/vendor/:id/edit"
              element={
                <MainLayout>
                  <VendorFormPage />
                </MainLayout>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
