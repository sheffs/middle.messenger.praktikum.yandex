export default function trim(str: string, chars?: string): string {
  if (chars === undefined) {
    return str.replace(/^[\s﻿\xA0]+|[\s﻿\xA0]+$/g, '');
  }
  const escaped = chars.replace(/[\]\\^-]/g, '\\$&');
  return str.replace(new RegExp(`^[${escaped}]+|[${escaped}]+$`, 'g'), '');
}
