/**
 * The header rshono's client sends to ask a page URL for its flight payload instead of the HTML document, and
 * the value its server checks for. `@rshono/core` does not export them, so they are mirrored here.
 */
export const FLIGHT_HEADER = "rsc";

export const FLIGHT_HEADER_VALUE = "1";
