const keySystems = [
  { name: 'com.widevine.alpha', label: 'Widevine' },
  { name: 'com.microsoft.playready', label: 'PlayReady' },
  { name: 'com.apple.fps.1_0', label: 'FairPlay' },
  { name: 'com.adobe.primetime', label: 'Adobe Primetime' }
];

async function getSupportedDRMs() {
  const supportedDRMs = [];
  const drmElement = document.getElementById('drmElement');
  
  // Show loading message
  drmElement.textContent = 'Detecting supported DRMs...';

  for (const ks of keySystems) {
    try {
      const config = [{
        initDataTypes: ['cenc'],
        videoCapabilities: [{
          contentType: 'video/mp4; codecs="avc1.42E01E"'
        }]
      }];

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const accessPromise = navigator.requestMediaKeySystemAccess(ks.name, config);
      
      await Promise.race([accessPromise, timeoutPromise]);
      supportedDRMs.push(ks.label);
    } catch (e) {
      console.debug(`DRM ${ks.label} not supported:`, e.message);
    }
  }

  return supportedDRMs;
}

export async function showSupportedDRMs() {
  const drmElement = document.getElementById('drmElement');
  
  // Check if EME is supported
  if (!navigator.requestMediaKeySystemAccess) {
    drmElement.textContent = 'EME (Encrypted Media Extensions) not supported in this browser.';
    return;
  }
  
  try {
    const supported = await getSupportedDRMs();

    if (supported.length === 0) {
      drmElement.textContent = 'No supported DRMs detected.';
    } else {
      drmElement.innerHTML = '<strong>Supported DRMs:</strong> ' + supported.join(', ');
    }
  } catch (error) {
    console.error('Error detecting DRMs:', error);
    drmElement.textContent = 'Error detecting DRM support.';
  }
}