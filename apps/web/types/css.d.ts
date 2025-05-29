declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'leaflet/dist/leaflet.css';
declare module 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
declare module 'leaflet-defaulticon-compatibility';