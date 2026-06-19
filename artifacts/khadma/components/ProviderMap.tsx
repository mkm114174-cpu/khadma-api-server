import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { requestStatusStyle } from "@/lib/requestStatus";

export interface CustomerRequest {
  id: string;
  service: string;
  client: string;
  price: number;
  distance: string;
  coordinate: { latitude: number; longitude: number };
  isNew: boolean;
  status: string;
}

interface Props {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  requests: CustomerRequest[];
  selectedRequest: CustomerRequest | null;
  locationGranted: boolean;
  onPinPress: (req: CustomerRequest) => void;
  onMapPress: () => void;
  mapRef?: React.RefObject<any>;
}

function buildProviderMapHtml(region: Props["region"], requests: CustomerRequest[]) {
  const markersJs = requests
    .map((r) => {
      const color = requestStatusStyle(r.status).color;
      const pulse = r.isNew
        ? `<div style="
            position:absolute;top:50%;left:50%;
            width:52px;height:52px;border-radius:50%;
            border:1.5px solid ${color};
            transform:translate(-50%,-50%);
            animation:pulse 1.8s ease-out infinite;
          "></div>
          <div style="
            position:absolute;top:50%;left:50%;
            width:40px;height:40px;border-radius:50%;
            border:1px solid ${color}55;
            transform:translate(-50%,-50%);
            animation:pulse 1.8s ease-out infinite 0.6s;
          "></div>`
        : "";

      const pinHtml = `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          ${pulse}
          <div style="
            position:relative;z-index:2;
            width:36px;height:36px;border-radius:50%;
            background:#111;border:2.5px solid ${color};
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 0 ${r.isNew ? "14px" : "4px"} ${color}${r.isNew ? "90" : "40"};
            cursor:pointer;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/><path d="M16 3H8L6 7h12l-2-4z"/>
            </svg>
          </div>
          ${r.isNew ? `<div style="
            position:absolute;top:-2px;right:-2px;z-index:3;
            width:12px;height:12px;border-radius:50%;
            background:${color};border:2px solid #0D0D0D;
          "></div>` : ""}
        </div>`;

      return `
        (function(){
          var icon = L.divIcon({ html: ${JSON.stringify(pinHtml)}, className: '', iconSize: [44,44], iconAnchor: [22,22] });
          var m = L.marker([${r.coordinate.latitude}, ${r.coordinate.longitude}], { icon: icon }).addTo(map);
          m.on('click', function(e){ L.DomEvent.stopPropagation(e); window.parent.postMessage(JSON.stringify({type:'pin',id:${JSON.stringify(r.id)}}), '*'); });
        })();`;
    })
    .join("\n");

  const userDot = `
    (function(){
      var icon = L.divIcon({
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#60A5FA;border:3px solid #fff;box-shadow:0 0 10px #60A5FA80;"></div>',
        className: '', iconSize: [16,16], iconAnchor: [8,8]
      });
      L.marker([${region.latitude}, ${region.longitude}], { icon: icon }).addTo(map);
    })();`;

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
  @keyframes pulse{
    0%{transform:translate(-50%,-50%) scale(0.8);opacity:0.8;}
    100%{transform:translate(-50%,-50%) scale(1.8);opacity:0;}
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{zoomControl:false,attributionControl:false})
    .setView([${region.latitude},${region.longitude}],14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    subdomains:'abcd', maxZoom:20
  }).addTo(map);
  ${markersJs}
  ${userDot}
  map.on('click', function(){ window.parent.postMessage(JSON.stringify({type:'map'}), '*'); });
<\/script>
</body>
</html>`;
}

export default function ProviderMap({ region, requests, onPinPress, onMapPress }: Props) {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === "pin") {
          const req = requests.find((r) => r.id === data.id);
          if (req) onPinPress(req);
        } else if (data.type === "map") {
          onMapPress();
        }
      } catch (_) {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }
  }, [requests, onPinPress, onMapPress]);

  const html = buildProviderMapHtml(region, requests);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* @ts-ignore */}
      <iframe
        key={requests.map((r) => r.id).join()}
        srcDoc={html}
        style={{
          position: "absolute" as any,
          top: 0, left: 0,
          width: "100%", height: "100%",
          border: "none",
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </View>
  );
}
