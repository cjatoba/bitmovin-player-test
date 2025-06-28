let player;

export async function loadMedia({
  bitmovinKey,
  dashUrl,
  hlsUrl,
  widevineLaUrl,
  playreadyLaUrl,
  fairplayLaUrl,
  fairplayCertUrl
}) {
  const conf = {
    key: bitmovinKey,
    playback: {
      autoplay: true,
      muted: false
    },
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

          return getProtocol(uri) === "skd" ? getContentId(uri) : "";
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

  if (!player) {
    player = new bitmovin.player.Player(
      document.getElementById("player"),
      conf
    );
  }

  await player.load(source);
}
