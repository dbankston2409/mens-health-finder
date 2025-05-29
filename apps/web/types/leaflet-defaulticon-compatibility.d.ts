// Type declarations for leaflet-defaulticon-compatibility
declare module 'leaflet-defaulticon-compatibility' {
  // This module doesn't export anything specific, it just modifies the Leaflet library
  // to fix icon handling. We're declaring it as a side-effect only module.
  const _: any;
  export = _;
}

// Also declare the CSS module
declare module 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css' {
  const content: any;
  export default content;
}