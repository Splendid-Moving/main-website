// Loads the same Google Places address picker used by the original form.
// Keep its dropdown inline on phones; the quote wizard handles loading errors.
(() => {
  const original = window.matchMedia.bind(window);
  window.matchMedia = (query) =>
    String(query).replace(/\s/g, "").toLowerCase() ===
    "onlyscreenand(max-width:450px)"
      ? {
          matches: false,
          media: query,
          onchange: null,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent() {
            return true;
          },
        }
      : original(query);
  window.initQuotePlaces = async () => {
    try {
      await google.maps.importLibrary("places");
      window.splendidPlacesReady = true;
      window.dispatchEvent(new Event("splendid:places"));
    } catch {
      window.quotePlacesFailed();
    }
  };
  window.quotePlacesFailed = () => {
    window.splendidPlacesUnavailable = true;
    window.dispatchEvent(new Event("splendid:places"));
  };
})();
