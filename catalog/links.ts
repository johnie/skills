const SCHEME_OR_ROOT = /^(?:[a-z][a-z\d+.-]*:|\/)/iu;

/**
 * A link that leaves the skill: a URI with a scheme, or a root-relative path. Every other link in a skill's
 * markdown is a file path relative to the file it is written in, optionally with a `#fragment`.
 */
export const isExternalLink = (url: string): boolean =>
  SCHEME_OR_ROOT.test(url);
