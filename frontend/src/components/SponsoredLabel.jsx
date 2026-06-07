import React from "react";

export default function SponsoredLabel({ compact = false }) {
  return (
    <span className={`sponsored-label ${compact ? "sponsored-label--compact" : ""}`}>
      Sponzorisano
    </span>
  );
}
