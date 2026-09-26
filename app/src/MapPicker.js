// Full-screen map to pin a saved place (Home / Office / Parents) on the exact building.
import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const page = (lat, lng) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0}
#pin{position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-34px 0 0 -17px;z-index:999;pointer-events:none}</style>
</head><body><div id="m"></div>
<svg id="pin" viewBox="0 0 24 24"><path fill="#E8590C" stroke="#fff" stroke-width="1"
d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var m = L.map('m').setView([${lat}, ${lng}], 17);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m);
function send() { var c = m.getCenter(); window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat, lng: c.lng })); }
m.on('moveend', send); send();
</script></body></html>`;

export default function MapPicker({ s, c, t, start, onClose, onPick }) {
  const pos = useRef(start);
  useEffect(() => { pos.current = start; }, [start]);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ padding: 16, paddingTop: 40, gap: 4 }}>
          <Text style={[s.h1, { fontSize: 19 }]}>{t.mapTitle}</Text>
          <Text style={s.sub}>{t.mapH}</Text>
        </View>
        <WebView style={{ flex: 1 }} originWhitelist={['*']}
          source={{ html: page(start.lat, start.lng), baseUrl: 'https://numayrhabib.github.io/alo-app/' }}
          onMessage={(e) => { try { pos.current = JSON.parse(e.nativeEvent.data); } catch (x) {} }} />
        <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 28 }}>
          <Pressable style={[s.ghostSm, { flex: 1, alignItems: 'center', padding: 13 }]} onPress={onClose}>
            <Text style={{ color: c.ink, fontWeight: '700' }}>{t.cancel}</Text>
          </Pressable>
          <Pressable style={[s.primary, { flex: 1, marginTop: 0 }]} onPress={() => onPick(pos.current)}>
            <Text style={s.primaryTxt}>{t.useSpot}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
