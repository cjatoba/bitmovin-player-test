const keySystems = [
  { name: 'com.widevine.alpha', label: 'Widevine' },
  { name: 'com.microsoft.playready', label: 'PlayReady' },
  { name: 'com.apple.fps.1_0', label: 'FairPlay' },
  { name: 'com.adobe.primetime', label: 'Adobe Primetime' }
];

async function getSupportedDRMs() {
  const supportedDRMs = [];

  for (const ks of keySystems) {
    try {
      const config = [{
        initDataTypes: ['cenc'],
        videoCapabilities: [{
          contentType: 'video/mp4; codecs="avc1.42E01E"'
        }]
      }];

      await navigator.requestMediaKeySystemAccess(ks.name, config);
      supportedDRMs.push(ks.label);
    } catch (e) {
      console.error(`DRM ${ks.label} not supported:`, e);
    }
  }

  return supportedDRMs;
}

export async function showSupportedDRMs() {
  const drmElement = document.getElementById('drmElement');
  const supported = await getSupportedDRMs();

  if (supported.length === 0) {
    drmElement.textContent = 'Nenhum DRM suportado foi detectado.';
  } else {
    drmElement.innerHTML = '<strong>Supported DRMs:</strong><ul>' +
      supported.map(drm => `<li>${drm}</li>`).join('') +
      '</ul>';
  }
}