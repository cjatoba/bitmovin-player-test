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
      // DRM não suportado
    }
  }

  return supportedDRMs;
}

async function showSupportedDRMs() {
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

showSupportedDRMs();

const loadMediaButton = document.getElementById("load-media-button");



loadMediaButton.onclick = () => {
  bitmovinKey = document.getElementById("bitmovin-key").value;
  dashUrl = document.getElementById("dash-url").value;
  hlsUrl = document.getElementById("hls-url").value;
  widevineLaUrl = document.getElementById("widevine-la-url").value;
  playreadyLaUrl = document.getElementById("playready-la-url").value;
  fairplayLaUrl = document.getElementById("fairplay-la-url").value;
  fairplayCertUrl = document.getElementById("fairplay-cert-url").value;

  const conf = {
    key: bitmovinKey
  };

  const source = {
    dash: dashUrl,
    hls: hlsUrl,
    drm: {
      widevine: {
        LA_URL: widevineLaUrl,
        maxLicenseRequestRetries: 3,
        licenseRequestRetryDelay: 100,
        headers: { "Content-Type": "text/xml" }
      },
      playready: {
        LA_URL: playreadyLaUrl,
        maxLicenseRequestRetries: 3,
        licenseRequestRetryDelay: 100,
        utf8message: true,
        plaintextChallenge: true,
        headers: { "Content-Type": "text/xml" }
      },
      fairplay: {
        LA_URL: fairplayLaUrl,
        certificateURL: fairplayCertUrl,
        maxLicenseRequestRetries: 3,
        licenseRequestRetryDelay: 100,
        prepareContentId: (uri) => {
          function getProtocol(uri) {
            return uri.split("://")[0].slice(-3).toLowerCase();
          }
          function getContentId(uri) {
            return uri.split("://")[1].split(":")[0];
          }

          return getProtocol(uri) == "skd" ? getContentId(uri) : "";
        },
        prepareLicenseAsync: (ckc) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("loadend", () =>
              resolve(new Uint8Array(reader.result))
            );
            reader.addEventListener("error", () => reject(reader.error));
            reader.readAsArrayBuffer(ckc);
          });
        },
        prepareMessage: (event) =>
          new Blob([event.message], { type: "application/octet-binary" }),
        headers: { "content-type": "application/octet-stream" },
        useUint16InitData: true,
        licenseResponseType: "blob"
      }
    }
  };

  const player = new bitmovin.player.Player(
    document.getElementById("player"),
    conf
  );

  player.load(source);
}