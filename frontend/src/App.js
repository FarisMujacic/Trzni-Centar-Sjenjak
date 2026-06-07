import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import StoreDetails from "./pages/StoreDetails";
import StoresCategoryPage from "./pages/StoresCategoryPage";
import AdvertisingPage from "./pages/AdvertisingPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAds from "./pages/AdminAds";
import AdminStores from "./pages/AdminStores";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function NotFound() {
  return (
    <main className="public-page public-page--centered">
      <p className="eyebrow">404</p>
      <h1>Stranica nije pronađena</h1>
      <p>Link je možda promijenjen ili trenutno nije aktivan.</p>
    </main>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/shopping"
          element={
            <StoresCategoryPage
              category="Shopping"
              title="Shopping"
              subtitle="Od butika i zlatara do tech prodavnica, sve na jednom mjestu."
            />
          }
        />
        <Route
          path="/food"
          element={
            <StoresCategoryPage
              category="Hrana i piće"
              title="Hrana i piće"
              subtitle="Kafići, restorani i mjesta za predah tokom posjete centru."
            />
          }
        />
        <Route
          path="/beauty"
          element={
            <StoresCategoryPage
              category="Beauty & usluge"
              title="Ljepota i usluge"
              subtitle="Frizerski i kozmetički saloni, njega i praktične usluge."
            />
          }
        />
        <Route
          path="/other"
          element={
            <StoresCategoryPage
              category="Ostalo"
              title="Ostalo"
              subtitle="Poslovne, fotografske i druge usluge dostupne u centru."
            />
          }
        />
        <Route path="/radnja/:id" element={<StoreDetails />} />
        <Route path="/oglasavanje" element={<AdvertisingPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ads"
          element={
            <ProtectedRoute>
              <AdminAds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stores"
          element={
            <ProtectedRoute>
              <AdminStores />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
