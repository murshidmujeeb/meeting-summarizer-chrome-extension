import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Note: Extension permissions and CSP are defined in package.json under the "manifest" key,
// which is the standard way Plasmo handles core manifest properties in Manifest V3.
// Permissions added: tabCapture, desktopCapture, storage, runtime
