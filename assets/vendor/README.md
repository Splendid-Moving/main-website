# HEIC photo decoder

`heic-to.js` is the unmodified CSP-compatible browser build of heic-to 1.6.6, loaded only when an iPhone HEIC/HEIF photo needs conversion. It uses libheif 1.23.6; the application uses the decoder as a separate browser module.

Source, including the code and build instructions: https://github.com/hoppergee/heic-to (exact-version package source: https://registry.npmjs.org/heic-to/-/heic-to-1.6.6.tgz; libheif source: https://github.com/strukturag/libheif/tree/v1.23.6). License: LGPL-3.0, reproduced in `heic-to.LICENSE.txt`. The replaceable module can be rebuilt from source and substituted at the same path.

To refresh, install the chosen pinned version of `heic-to`, copy its `dist/csp/heic-to.js` and `LICENSE` here, then verify HEIC conversion in the browser. The decoder is not loaded for ordinary JPEG, PNG, or WebP files.
