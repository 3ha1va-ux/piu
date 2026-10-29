"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  GEORGIA_CENTER,
  GEORGIA_MAX_BOUNDS,
  GEORGIA_MAX_BOUNDS_VISCOSITY,
  GEORGIA_ZOOM,
} from "@/data/listings-types";
import { useClientReady } from "@/lib/useClientReady";
import "leaflet/dist/leaflet.css";

type LocationPickerMapProps = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
};

const pickIcon = L.divIcon({
  className: "ipove-picker",
  iconSize: [28, 36],
  iconAnchor: [14, 34],
  html: `<div style="width:28px;height:36px;display:flex;align-items:flex-end;justify-content:center">
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C7.373 0 2 5.373 2 12c0 8.25 12 24 12 24s12-15.75 12-24C26 5.373 20.627 0 14 0z" fill="#1f4a3a"/>
      <circle cx="14" cy="12" r="5" fill="#eef4f0"/>
    </svg>
  </div>`,
});

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToSelection({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.55 });
  }, [lat, lng, map]);

  return null;
}

export default function LocationPickerMap({
  lat,
  lng,
  onPick,
}: LocationPickerMapProps) {
  const ready = useClientReady();

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#d8e6df] text-sm text-moss">
        რუკა იტვირთება…
      </div>
    );
  }

  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : GEORGIA_CENTER;
  const zoom = lat != null && lng != null ? 14 : GEORGIA_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={false}
      minZoom={6.5}
      maxZoom={19}
      maxBounds={GEORGIA_MAX_BOUNDS}
      maxBoundsViscosity={GEORGIA_MAX_BOUNDS_VISCOSITY}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains={["a", "b", "c"]}
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ZoomControl position="bottomright" />
      <ClickHandler onPick={onPick} />
      <FlyToSelection lat={lat} lng={lng} />
      {lat != null && lng != null ? (
        <Marker position={[lat, lng]} icon={pickIcon} />
      ) : null}
    </MapContainer>
  );
}
