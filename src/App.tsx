
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui/spinner"; // We'll create this component

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const TimeTracking = React.lazy(() => import("./pages/TimeTracking"));
const Invoicing = React.lazy(() => import("./pages/Invoicing"));
const Clients = React.lazy(() => import("./pages/Clients"));
const Activities = React.lazy(() => import("./pages/Activities"));
const Settings = React.lazy(() => import("./pages/Settings"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Configure the query client with performance options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={
                <Suspense fallback={<div className="flex items-center justify-center h-96"><Spinner /></div>}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="time-tracking" element={
                <Suspense fallback={<div className="flex items-center justify-center h-96"><Spinner /></div>}>
                  <TimeTracking />
                </Suspense>
              } />
              <Route path="invoicing" element={
                <Suspense fallback={<div className="flex items-center justify-center h-96"><Spinner /></div>}>
                  <Invoicing />
                </Suspense>
              } />
              <Route path="clients" element={
                <Suspense fallback={<div className="flex items-center justify-center h-96"><Spinner /></div>}>
                  <Clients />
                </Suspense>
              } />
              <Route path="activities" element={
                <Suspense fallback={<div className="flex items-center justify-center h-96"><Spinner /></div>}>
                  <Activities />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<div className="flex items-center justify-center h-96"><Spinner /></div>}>
                  <Settings />
                </Suspense>
              } />
              <Route path="*" element={
                <Suspense fallback={<div className="flex items-center justify-center h-96"><Spinner /></div>}>
                  <NotFound />
                </Suspense>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
