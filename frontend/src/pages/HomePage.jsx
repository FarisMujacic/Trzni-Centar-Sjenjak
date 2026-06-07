import React, { useEffect, useState } from "react";
import { fetchAds } from "../api/adsApi";
import { fetchStores } from "../api/storesApi";
import Background from "../components/Background";
import Offers from "../components/Offers";
import WhatWeOffer from "../components/WhatWeOffer";
import StoreDirectory from "../components/StoreDirectory";
import InlineAdBanner from "../components/InlineAdBanner";
import Gallery from "../components/Gallery";
import AdvertisingCTA from "../components/AdvertisingCTA";
import "../styles/home.css";

export default function HomePage() {
  const [ads, setAds] = useState([]);
  const [stores, setStores] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let active = true;

    Promise.allSettled([fetchAds(), fetchStores()])
      .then(([adsResult, storesResult]) => {
        if (!active) return;

        const adsData = adsResult.status === "fulfilled" ? adsResult.value : [];
        const storesData =
          storesResult.status === "fulfilled" ? storesResult.value : [];

        if (adsResult.status === "rejected") {
          console.error("Ads fetch error:", adsResult.reason);
        }
        if (storesResult.status === "rejected") {
          console.error("Stores fetch error:", storesResult.reason);
        }

        setAds(Array.isArray(adsData) ? adsData : []);
        setStores(Array.isArray(storesData) ? storesData : []);
        setState({
          loading: false,
          error:
            adsResult.status === "rejected" || storesResult.status === "rejected"
              ? "Dio sadržaja trenutno nije moguće učitati."
              : "",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="home">
      <Background />
      {state.error && <p className="home__notice">{state.error}</p>}
      <Offers offers={ads} loading={state.loading} />
      <WhatWeOffer stores={stores} />
      <StoreDirectory stores={stores} loading={state.loading} />
      <InlineAdBanner ad={ads[1]} />
      <Gallery />
      <AdvertisingCTA />
    </main>
  );
}
