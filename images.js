// Normal browser JavaScript cannot scan a local folder by itself.
// Browsers block that for privacy and security, so this file is the image list.
// To add or remove scary images later, update the filenames in scaryImages.

const ASSET_PATHS = {
  images: "assets/images/",
  sounds: "assets/sounds/",
  ui: "assets/ui/"
};

const scaryImages = [
  "1.png",
  "2.png",
  "3.png"
];

// Sound support is ready for Stage II.
// Add future sound filenames here after placing them in assets/sounds.
const scarySounds = [];

const GameAssets = {
  images: scaryImages.map(filename => ASSET_PATHS.images + filename),
  sounds: scarySounds.map(filename => ASSET_PATHS.sounds + filename)
};
