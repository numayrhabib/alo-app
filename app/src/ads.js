import React from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import { BANNER_UNIT_ID } from './config';

// Banner ads only: no pop-ups, no video. In Expo Go the AdMob module isn't available,
// so a grey placeholder shows instead.
let Ads = null;
if (Constants.executionEnvironment !== 'storeClient') {
  try {
    Ads = require('react-native-google-mobile-ads');
  } catch (e) {
    Ads = null;
  }
}

let started = false;
export function startAds() {
  if (!Ads || started) return;
  started = true;
  try {
    Ads.default().initialize();
  } catch (e) {}
}

const unit = () => BANNER_UNIT_ID || (Ads ? Ads.TestIds.ADAPTIVE_BANNER : '');

function Placeholder({ c, label, height }) {
  return (
    <View style={{ height, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: c.line,
      alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface }}>
      <Text style={{ color: c.ink3, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

// Fixed banner above the tab bar.
export function BottomBanner({ c, hidden }) {
  if (hidden) return null;
  if (!Ads) return <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}><Placeholder c={c} label="AD · banner" height={52} /></View>;
  return (
    <View style={{ alignItems: 'center', backgroundColor: c.bg }}>
      <Ads.BannerAd unitId={unit()} size={Ads.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
    </View>
  );
}

// Banner inside a screen, styled as a card so it doesn't look like app content.
export function InlineBanner({ c, label }) {
  return (
    <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: 16, backgroundColor: c.surface, padding: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: c.ink3, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: c.ink3, fontSize: 10, fontWeight: '700', borderWidth: 1, borderColor: c.ink3, borderRadius: 4, paddingHorizontal: 4 }}>AD</Text>
      </View>
      {Ads ? (
        <View style={{ alignItems: 'center' }}>
          <Ads.BannerAd unitId={unit()} size={Ads.BannerAdSize.LARGE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
        </View>
      ) : (
        <Placeholder c={c} label="AD · 320×100" height={100} />
      )}
    </View>
  );
}
