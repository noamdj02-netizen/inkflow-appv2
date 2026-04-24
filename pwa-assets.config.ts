import {
  defineConfig,
  combinePresetAndAppleSplashScreens,
  AllAppleDeviceNames,
  type AppleDeviceName,
} from '@vite-pwa/assets-generator/config';

/** Splashes iPhone uniquement (pas iPad / iPod). */
const iphoneSplashDevices = (AllAppleDeviceNames as readonly string[]).filter((d) =>
  d.includes('iPhone')
) as AppleDeviceName[];

const inkflowIconPreset = {
  transparent: {
    sizes: [48, 72, 96, 128, 144, 152, 192, 384, 512],
    favicons: [[48, 'favicon.ico'] as [number, string]],
  },
  maskable: { sizes: [512] },
  apple: { sizes: [180] },
};

export default defineConfig({
  images: ['public/icon-ios-source.svg'],
  headLinkOptions: { basePath: '/', preset: '2023' },
  preset: combinePresetAndAppleSplashScreens(
    inkflowIconPreset,
    {
      padding: 0.28,
      resizeOptions: { background: '#0a0a0a', fit: 'contain' },
      /** Même pattern que defaultAssetName côté fichiers (évite -light- dans hrefs sans PNG correspondant). */
      name: (landscape, size) =>
        `apple-splash-${landscape ? 'landscape' : 'portrait'}-${size.width}x${size.height}.png`,
    },
    iphoneSplashDevices
  ),
});
