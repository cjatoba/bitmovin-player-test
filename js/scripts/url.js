export function updateUrlWithParams(params) {
  const searchParams = new URLSearchParams(params);
  const newUrl = `${location.protocol}//${location.host}${location.pathname}?${searchParams.toString()}`;
  history.replaceState(null, '', newUrl);
}

function fillFieldsFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const fields = [
    'bitmovin-key', 'dash-url', 'hls-url',
    'widevine-la-url', 'playready-la-url',
    'fairplay-la-url', 'fairplay-cert-url'
  ];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (params.has(id)) {
      el.value = params.get(id);
    }
  });
}

window.addEventListener('DOMContentLoaded', fillFieldsFromUrl);