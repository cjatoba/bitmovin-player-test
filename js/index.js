import { showSupportedDRMs } from "./scripts/drm.js";
import { updateUrlWithParams } from "./scripts/url.js";
import { loadMedia } from "./scripts/player.js";

showSupportedDRMs().catch(console.error);

const loadMediaButton = document.getElementById("load-media-button");

loadMediaButton.onclick = () => {
  const bitmovinKey = document.getElementById("bitmovin-key").value;
  const dashUrl = document.getElementById("dash-url").value;
  const hlsUrl = document.getElementById("hls-url").value;
  const widevineLaUrl = document.getElementById("widevine-la-url").value;
  const playreadyLaUrl = document.getElementById("playready-la-url").value;
  const fairplayLaUrl = document.getElementById("fairplay-la-url").value;
  const fairplayCertUrl = document.getElementById("fairplay-cert-url").value;

  updateUrlWithParams({
    'bitmovin-key': bitmovinKey,
    'dash-url': dashUrl,
    'hls-url': hlsUrl,
    'widevine-la-url': widevineLaUrl,
    'playready-la-url': playreadyLaUrl,
    'fairplay-la-url': fairplayLaUrl,
    'fairplay-cert-url': fairplayCertUrl
  });

  loadMedia({
    bitmovinKey,
    dashUrl,
    hlsUrl,
    widevineLaUrl,
    playreadyLaUrl,
    fairplayLaUrl,
    fairplayCertUrl
  }).catch(error => {
    console.error("Error loading media:", error);
  })
};
