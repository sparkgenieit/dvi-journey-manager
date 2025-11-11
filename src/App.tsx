import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import DynamicMeta from "@/components/DynamicMeta";

import { MainLayout } from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import { CreateItinerary } from "./pages/CreateItinerary";
import { LatestItinerary } from "./pages/LatestItinerary";
import { AccountsManager } from "./pages/AccountsManager";
import "./App.css";
import NotFound from "./pages/NotFound";
import { AccountsLedger } from "./pages/AccountsLedger";
import Hotels from "./pages/Hotels";
import Login from "./pages/Login";
import HotelForm from "./pages/HotelForm";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
       <DynamicMeta />
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/create-itinerary" element={<MainLayout><CreateItinerary /></MainLayout>} />
            <Route path="/latest-itinerary" element={<MainLayout><LatestItinerary /></MainLayout>} />
            <Route path="/accounts-manager" element={<MainLayout><AccountsManager /></MainLayout>} />
            <Route path="/accounts-ledger" element={<MainLayout><AccountsLedger /></MainLayout>} />

            {/* Hotels */}
            {/* Hotels */}
<Route path="/hotels" element={<MainLayout><Hotels /></MainLayout>} />

{/* Create */}
<Route path="/hotels/new" element={<MainLayout><HotelForm /></MainLayout>} />

{/* Edit (primary) */}
<Route path="/hotels/:id/edit" element={<MainLayout><HotelForm /></MainLayout>} />

{/* Edit (alias): allow /hotels/:id to open the same form */}
<Route path="/hotels/:id" element={<MainLayout><HotelForm /></MainLayout>} />

{/* Deep-links for each step */}
<Route path="/hotels/:id/rooms" element={<RoomsRedirect />} />
<Route path="/hotels/:id/amenities" element={<AmenitiesRedirect />} />
<Route path="/hotels/:id/pricebook" element={<PriceBookRedirect />} />
<Route path="/hotels/:id/reviews" element={<ReviewsRedirect />} />
<Route path="/hotels/:id/preview" element={<PreviewRedirect />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
