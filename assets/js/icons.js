const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  box: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5"/>',
  layers:
    '<path d="m12 3 10 6-10 6L2 9l10-6Z"/><path d="m2 13 10 6 10-6M2 17l10 6 10-6"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5"/>',
  purchase:
    '<path d="M3 3h2l3 12h10l3-9H6M12 2v8m-3-3 3 3 3-3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  sale: '<path d="M4 3h16v18l-4-2-4 2-4-2-4 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  chart: '<path d="M4 3v18h17M8 16v-5M13 16V6M18 16v-8"/>',
  wallet:
    '<path d="M20 7V4H5a3 3 0 0 0 0 6h16v10H5a3 3 0 0 1-3-3V7M21 10v5h-5v-5"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14l-1 7 7-2"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  branch:
    '<path d="M5 3v12a4 4 0 0 0 4 4h10M5 8h10a4 4 0 0 1 4 4v7M16 16l3 3 3-3"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 5 5 3-3 5 5"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  filter: '<path d="M3 4h18l-7 8v7l-4 2v-9L3 4Z"/>',
  alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 17v1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3"/>',
  arrow: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  settings:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 6 10 7L22 6"/>',
  shield:
    '<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
};
export function icon(name, size = 20) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.box}</svg>`;
}
