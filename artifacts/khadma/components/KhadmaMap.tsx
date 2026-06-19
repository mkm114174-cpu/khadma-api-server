import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { requestStatusStyle, type RequestMarker } from "@/lib/requestStatus";

const logoModule: any = require("@/assets/images/logo_clean.png");
let LOGO_URI: string =
  typeof logoModule === "string" ? logoModule : logoModule?.uri ?? logoModule?.default ?? "";
if (LOGO_URI.startsWith("/") && typeof window !== "undefined") {
  LOGO_URI = window.location.origin + LOGO_URI;
}

export interface NearbyProvider {
  id: string;
  serviceId: string;
  serviceName: string;
  providerName?: string;
  categoryId: string;
  city: string;
  coordinate: { latitude: number; longitude: number };
  price: number;
  rating: number;
}

export interface TownMarker {
  id: string;
  name: string;
  count: number;
  coordinate: { latitude: number; longitude: number };
}

interface Props {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  towns: TownMarker[];
  selectedTownId?: string | null;
  locationGranted: boolean;
  onTownPress: (town: TownMarker) => void;
  onMapPress: () => void;
  mapRef?: React.RefObject<any>;
  requests?: RequestMarker[];
}

// Escape user-provided strings before embedding them into the iframe srcDoc HTML.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildMapHtml(region: Props["region"], towns: TownMarker[], requests: RequestMarker[]) {
  const requestMarkersJs = requests
    .map((r) => {
      const color = requestStatusStyle(r.status).color;
      const iconHtml = `
        <div style="
          width:28px;height:28px;border-radius:50%;
          background:${color}33;border:2.5px solid ${color};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.6), inset 0 0 6px ${color}44;
          filter: brightness(1.1);
        ">
          <div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></div>
        </div>`;
      return `
        (function(){
          var icon = L.divIcon({ html: ${JSON.stringify(iconHtml)}, className: '', iconSize: [28,28], iconAnchor: [14,14] });
          L.marker([${r.coordinate.latitude}, ${r.coordinate.longitude}], { icon: icon }).addTo(map);
        })();`;
    })
    .join("\n");

  const markersJs = towns
    .map((tn) => {
      const iconHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;width:140px;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.6));">
          <div style="position:relative;width:64px;height:64px;border-radius:22px;overflow:visible;
            background:#141414;border:2px solid #C8A574;box-shadow:inset 0 0 10px rgba(200,165,116,0.2);">
            <div style="position:absolute;inset:-4px;border-radius:26px;border:1px solid rgba(200,165,116,0.3);pointer-events:none;"></div>
            <img src="${LOGO_URI}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:20px;" />
            <div style="position:absolute;top:-10px;right:-10px;min-width:30px;height:30px;padding:0 6px;
              border-radius:15px;background:#C8A574;border:2px solid #0A0A0A;color:#FFFFFF;font-weight:900;
              font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 8px rgba(0,0,0,0.3);">${tn.count}</div>
          </div>
          <div style="margin-top:10px;max-width:130px;padding:6px 12px;border-radius:12px;
            background:rgba(20,20,20,0.95);border:1px solid rgba(200,165,116,0.4);color:#C8A574;
            font-size:13px;font-weight:700;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
            box-shadow:0 4px 12px rgba(0,0,0,0.4);letter-spacing:0.3px;">${escapeHtml(tn.name)}</div>
        </div>`;
      return `
        (function(){
          var icon = L.divIcon({ html: ${JSON.stringify(iconHtml)}, className: '', iconSize: [140,100], iconAnchor: [70,100] });
          var m = L.marker([${tn.coordinate.latitude}, ${tn.coordinate.longitude}], { icon: icon }).addTo(map);
          m.on('click', function(e){ L.DomEvent.stopPropagation(e); window.parent.postMessage(JSON.stringify({type:'town',id:${JSON.stringify(tn.id)}}), '*'); });
        })();`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:100%;height:100%;background:#0D0D0D;overflow:hidden;}
  #map{width:100%;height:100%;}
  .leaflet-control-attribution,.leaflet-control-zoom{display:none;}
  .leaflet-container{background:#0D0D0D;}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{zoomControl:false,attributionControl:false});
  var latD = ${region.latitudeDelta} || 0.1;
  var lngD = ${region.longitudeDelta} || 0.1;
  map.fitBounds([
    [${region.latitude} - latD/2, ${region.longitude} - lngD/2],
    [${region.latitude} + latD/2, ${region.longitude} + lngD/2]
  ], { padding: [0,0] });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20}).addTo(map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20,opacity:0.8}).addTo(map);
  ${markersJs}
  ${requestMarkersJs}
  map.on('click', function(){ window.parent.postMessage(JSON.stringify({type:'map'}), '*'); });
<\/script>
</body>
</html>`;
}

export default function KhadmaMap({ region, towns, onTownPress, onMapPress, requests = [] }: Props) {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === "town") {
          const tn = towns.find((t) => t.id === data.id);
          if (tn) onTownPress(tn);
        } else if (data.type === "map") {
          onMapPress();
        }
      } catch (_) {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }
  }, [towns, onTownPress, onMapPress]);

  const html = buildMapHtml(region, towns, requests);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* @ts-ignore — iframe is valid DOM on web */}
      <iframe
        key={`${towns.length}-${requests.length}`}
        srcDoc={html}
        style={{
          position: "absolute" as any,
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </View>
  );
}
