const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/**
 * True for code points permitted in XML 1.0:
 *   #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
 */
function isValidXmlCodePoint(cp: number): boolean {
  return (
    cp === 0x09 ||
    cp === 0x0a ||
    cp === 0x0d ||
    (cp >= 0x20 && cp <= 0xd7ff) ||
    (cp >= 0xe000 && cp <= 0xfffd) ||
    (cp >= 0x10000 && cp <= 0x10ffff)
  );
}

/** Drop characters that are illegal in XML 1.0 (incl. lone surrogates). */
function stripInvalidXml(value: string): string {
  let out = '';
  for (const char of value) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && isValidXmlCodePoint(cp)) {
      out += char;
    }
  }
  return out;
}

/**
 * Escape arbitrary text for safe inclusion in SVG/XML element content and
 * attribute values. Invalid XML characters are stripped first; then
 * `& < > " '` are entity-encoded. This is the single choke point that makes the
 * renderer safe against XSS from untrusted seeds.
 */
export function escapeXml(value: string): string {
  return stripInvalidXml(value).replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char);
}
