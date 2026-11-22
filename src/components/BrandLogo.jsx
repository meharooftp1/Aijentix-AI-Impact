import React from "react";

/**
 * Official Aijentix brand lockup (silver wordmark + blue mark), taken from
 * aijentix.com. The full lockup is designed for dark surfaces; on light
 * surfaces place it inside a dark brand panel.
 */
export default function BrandLogo({ variant = "full", className = "", alt = "Aijentix" }) {
  const src = variant === "mark" ? "/brand/aijentix-icon.png" : "/brand/aijentix-logo.png";
  return <img src={src} alt={alt} className={className} draggable="false" />;
}