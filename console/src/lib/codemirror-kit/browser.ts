// code referenced from https://github.com/codemirror/view/blob/main/src/browser.ts

let nav: any =
  typeof navigator != "undefined"
    ? navigator
    : { userAgent: "", vendor: "", platform: "" };
const ie_edge = /Edge\/(\d+)/.exec(nav.userAgent);
const ie_upto10 = /MSIE \d/.test(nav.userAgent);
const ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(nav.userAgent);
const ie = !!(ie_upto10 || ie_11up || ie_edge);
const safari = !ie && /Apple Computer/.test(nav.vendor);
const ios =
  safari && (/Mobile\/\w+/.test(nav.userAgent) || nav.maxTouchPoints > 2);
const windows = /Win/.test(nav.platform);

export default {
  mac: ios || /Mac/.test(nav.platform),
  windows: /Win/.test(nav.platform),
  linux: /Linux|X11/.test(nav.platform),
};