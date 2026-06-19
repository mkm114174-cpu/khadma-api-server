import React from "react";
import { StyleSheet, View } from "react-native";

import type { LatLng } from "@/lib/routing";

interface Props {
  destination: LatLng;
  live: LatLng;
  route: LatLng[];
  follow?: boolean;
  height?: number;
}

function buildHtml(destination: LatLng, live: LatLng, route: LatLng[]) {
  const line = (route.length >= 2 ? route : [live, destination])
    .map((c) => `[${c.latitude},${c.longitude}]`)
    .join(",");

  const homeIcon =
    `'<div style="width:34px;height:34px;border-radius:50%;background:#111;border:2px solid #C8A574;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.7);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8A574" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d=\\"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\\"/><polyline points=\\"9 22 9 12 15 12 15 22\\"/></svg></div>'`;

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
  .leaflet-control-attribution{display:none;}
  .leaflet-container{background:#0D0D0D;}
  .pulse{width:22px;height:22px;border-radius:50%;background:#60A5FA;border:3px solid #fff;box-shadow:0 0 0 rgba(96,165,250,0.7);animation:pulse 1.8s infinite;}
  @keyframes pulse{
    0%{box-shadow:0 0 0 0 rgba(96,165,250,0.6);}
    70%{box-shadow:0 0 0 18px rgba(96,165,250,0);}
    100%{box-shadow:0 0 0 0 rgba(96,165,250,0);}
  }
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
  L.polyline(line, { color:'#C8A574', weight:6, opacity:0.95, lineJoin:'round', lineCap:'round' }).addTo(map);
  var liveIcon = L.divIcon({ html:'<div class="pulse"></div>', className:'', iconSize:[22,22], iconAnchor:[11,11] });
  var homeIcon = L.divIcon({ html:${homeIcon}, className:'', iconSize:[34,34], iconAnchor:[17,17] });
  L.marker([${live.latitude},${live.longitude}], { icon: liveIcon }).addTo(map);
  L.marker([${destination.latitude},${destination.longitude}], { icon: homeIcon }).addTo(map);
  map.fitBounds([[${live.latitude},${live.longitude}],[${destination.latitude},${destination.longitude}]], { padding:[60,60], maxZoom:16 });
<\/script>
</body>
</html>`;
}

export default function LiveRouteMap({ destination, live, route, height = 360 }: Props) {
  const html = buildHtml(destination, live, route);
  return (
    <View style={[styles.wrap, { height }]}>
      {/* @ts-ignore — iframe is valid DOM on web */}
      <iframe
        key={`${live.latitude.toFixed(4)},${live.longitude.toFixed(4)},${route.length}`}
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
  wrap: { overflow: "hidden", backgroundColor: "#0D0D0D" },
});
