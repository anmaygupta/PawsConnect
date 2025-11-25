import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Report from "@/pages/report";
import Stories from "@/pages/stories";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Routes>
      {/* Main landing page - works for both guests and logged-in users */}
      <Route path="/" element={<Landing />} />
      
      {/* Public routes - accessible to everyone */}
      <Route path="/search" element={<Search />} />
      <Route path="/search/:zipCode" element={<Search />} />
      <Route path="/stories" element={<Stories />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/home" element={<Home />} />
      <Route path="/report" element={<Report />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Toaster />
          <Router />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
