// Dev-only console logger. No-ops in production (import.meta.env.DEV === false) so
// app-init / wallet / icon chatter stays out of end users' consoles. Uses console.info
// internally so a blanket console.log→dlog sweep can't recurse. Prefer this over raw
// console.log for anything that would otherwise fire on every page load.
export const dlog = (...args: unknown[]): void => {
  if (import.meta.env.DEV) console.info(...args);
};
