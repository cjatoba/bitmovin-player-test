import { getLogManager } from './logs.js';

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
  const logManager = getLogManager();
  
  if (logManager) {
    logManager.addLog('info', 'Starting media load...');
  }

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
    if (logManager) {
      logManager.addLog('info', 'Creating new Bitmovin Player instance...');
    }
    
    player = new bitmovin.player.Player(
      document.getElementById("player"),
      conf
    );
    
    // Add player event listeners for logging
    setupPlayerEventListeners(player, logManager);
  }

  if (logManager) {
    logManager.addLog('info', 'Loading source into player...');
    logManager.addLog('debug', `Source config: ${JSON.stringify(source, null, 2)}`);
  }

  await player.load(source);
  
  if (logManager) {
    logManager.addLog('info', 'Media loaded successfully');
  }
}

function setupPlayerEventListeners(player, logManager) {
  if (!logManager) return;
  
  // Player lifecycle events
  player.on('ready', () => {
    logManager.logPlayerEvent('ready');
  });
  
  player.on('sourceloaded', (event) => {
    logManager.logPlayerEvent('sourceloaded', {
      duration: event.duration,
      downloadUrl: event.downloadUrl
    });
  });
  
  player.on('play', () => {
    logManager.logPlayerEvent('play');
  });
  
  player.on('pause', () => {
    logManager.logPlayerEvent('pause');
  });
  
  player.on('ended', () => {
    logManager.logPlayerEvent('ended');
  });
  
  player.on('timechanged', (event) => {
    // Log time changes less frequently to avoid spam
    if (event.time % 10 < 0.5) { // Log every ~10 seconds
      logManager.logPlayerEvent('timechanged', {
        currentTime: event.time.toFixed(2),
        duration: player.getDuration()?.toFixed(2)
      });
    }
  });
  
  // Quality and adaptation events
  player.on('videoqualitychanged', (event) => {
    logManager.logPlayerEvent('videoqualitychanged', {
      targetQuality: event.targetQuality,
      sourceQuality: event.sourceQuality
    });
  });
  
  player.on('audioqualitychanged', (event) => {
    logManager.logPlayerEvent('audioqualitychanged', {
      targetQuality: event.targetQuality,
      sourceQuality: event.sourceQuality
    });
  });
  
  // DRM events
  player.on('drmdata', (event) => {
    logManager.logPlayerEvent('drmdata', {
      type: event.type,
      licenseRequestType: event.licenseRequestType
    });
  });
  
  player.on('drmlicenseupdated', (event) => {
    logManager.logPlayerEvent('drmlicenseupdated', {
      type: event.type
    });
  });
  
  // Error events
  player.on('error', (event) => {
    logManager.logPlayerError({
      code: event.code,
      message: event.message,
      data: event.data
    });
  });
  
  player.on('warning', (event) => {
    logManager.addLog('warn', `Player Warning: ${event.message} (Code: ${event.code})`);
  });
  
  // Network and buffering events
  player.on('stallstarted', () => {
    logManager.logPlayerEvent('stallstarted');
  });
  
  player.on('stallended', () => {
    logManager.logPlayerEvent('stallended');
  });
  
  player.on('downloadfinished', (event) => {
    logManager.logPlayerEvent('downloadfinished', {
      url: event.url,
      downloadTime: event.downloadTime,
      size: event.size,
      type: event.type
    });
  });
  
  // Player state events
  player.on('playerresize', (event) => {
    logManager.logPlayerEvent('playerresize', {
      width: event.width,
      height: event.height
    });
  });
  
  player.on('fullscreenenter', () => {
    logManager.logPlayerEvent('fullscreenenter');
  });
  
  player.on('fullscreenexit', () => {
    logManager.logPlayerEvent('fullscreenexit');
  });
}
