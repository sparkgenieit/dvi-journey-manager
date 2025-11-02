import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import { CreateItinerary } from "./pages/CreateItinerary";
import { LatestItinerary } from "./pages/LatestItinerary";
import { AccountsManager } from "./pages/AccountsManager";
import "./App.css";
import NotFound from "./pages/NotFound";
import { AccountsLedger } from "./pages/AccountsLedger";
import Hotels from "./pages/Hotels";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/create-itinerary" element={<MainLayout><CreateItinerary /></MainLayout>} />
          <Route path="/latest-itinerary" element={<MainLayout><LatestItinerary /></MainLayout>} />
          <Route path="/accounts-manager" element={<MainLayout><AccountsManager /></MainLayout>} />
          <Route path="/accounts-ledger" element={<MainLayout><AccountsLedger /></MainLayout>} />
          <Route path="/hotels" element={<MainLayout><Hotels /></MainLayout>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
