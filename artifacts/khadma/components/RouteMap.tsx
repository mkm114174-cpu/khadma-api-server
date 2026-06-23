import React from "react";
import { StyleSheet, View } from "react-native";

import type { LatLng } from "@/lib/routing";

interface Props {
  customer: LatLng;
  provider: LatLng;
  route: LatLng[];
  height?: number;
}

function buildHtml(customer: LatLng, provider: LatLng, route: LatLng[]) {
  const line = (route.length >= 2 ? route : [provider, customer])
    .map((c) => `[${c.latitude},${c.longitude}]`)
    .join(",");

  const pinIcon = (color: string, path: string) =>
    `'<div style="width:30px;height:30px;border-radius:50%;background:#111;border:2px solid ${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.6);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg></div>'`;

  const providerIcon = pinIcon(
    "#60A5FA",
    '<rect x=\\"1\\" y=\\"3\\" width=\\"15\\" height=\\"13\\"/><polygon points=\\"16 8 20 8 23 11 23 16 16 16 16 8\\"/><circle cx=\\"5.5\\" cy=\\"18.5\\" r=\\"2.5\\"/><circle cx=\\"18.5\\" cy=\\"18.5\\" r=\\"2.5\\"/>',
  );
  const customerIcon = pinIcon(
    "#C8A574",
    '<path d=\\"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\\"/><polyline points=\\"9 22 9 12 15 12 15 22\\"/>',
  );

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
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    subdomains:'abcd', maxZoom:20
  }).addTo(map);
  var line = [${line}];
  L.polyline(line, { color:'#C8A574', weight:4, opacity:0.9 }).addTo(map);
  var provIcon = L.divIcon({ html:${providerIcon}, className:'', iconSize:[30,30], iconAnchor:[15,15] });
  var custIcon = L.divIcon({ html:${customerIcon}, className:'', iconSize:[30,30], iconAnchor:[15,15] });
  L.marker([${provider.latitude},${provider.longitude}], { icon: provIcon }).addTo(map);
  L.marker([${customer.latitude},${customer.longitude}], { icon: custIcon }).addTo(map);
  map.fitBounds([[${provider.latitude},${provider.longitude}],[${customer.latitude},${customer.longitude}]], { padding:[40,40] });
<\/script>
</body>
</html>`;
}

export default function RouteMap({ customer, provider, route, height = 220 }: Props) {
  const html = buildHtml(customer, provider, route);
  return (
    <View style={[styles.wrap, { height }]}>
      {/* @ts-ignore — iframe is valid DOM on web */}
      <iframe
        key={`${provider.latitude},${customer.latitude},${route.length}`}
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

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: "hidden", backgroundColor: "#0D0D0D" },
});
