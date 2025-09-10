import { showSupportedDRMs } from "./scripts/drm.js";
import { updateUrlWithParams } from "./scripts/url.js";
import { loadMedia } from "./scripts/player.js";
import { initializeLogs } from "./scripts/logs.js";

// Wait for DOM and Bitmovin to be ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing...');
  
  // Initialize logs system
  const logManager = initializeLogs();
  console.log('Logs initialized');

  // Wait for Bitmovin player to be available
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds max
  
  console.log('Waiting for Bitmovin player...');
  while (!window.bitmovin && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.bitmovin) {
    console.error('Bitmovin player failed to load');
    const drmElement = document.getElementById('drmElement');
    if (drmElement) {
      drmElement.textContent = 'Error: Bitmovin player failed to load';
    }
    return;
  }
  
  console.log('Bitmovin player loaded successfully');

  // Initialize DRM detection
  console.log('Starting DRM detection...');
  showSupportedDRMs().catch(console.error);

  const loadMediaButton = document.getElementById("load-media-button");
  console.log('Setting up load media button...');

  loadMediaButton.onclick = () => {
    console.log('Load media button clicked');
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
      if (logManager) {
        logManager.logPlayerError(error);
      }
    }).finally(() => {
      const loadingMessageElement = document.getElementById("loading-message");

      if (loadingMessageElement) {
        loadingMessageElement.style.display = "none";
      }
    });
  };
});
