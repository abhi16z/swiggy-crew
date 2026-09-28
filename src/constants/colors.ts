// Icons and TextInput placeholders take a color prop, not a class, so they follow the color
// scheme by hand. `muted` meets 4.5:1 on the neutral-100 and neutral-800 input fills.
export const ICON_COLORS = {
  light: { primary: '#171717', muted: '#737373' },
  dark: { primary: '#fafafa', muted: '#a3a3a3' },
} as const;
