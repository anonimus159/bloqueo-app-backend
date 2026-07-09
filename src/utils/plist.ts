/**
 * CodeCraft Custom Plist XML Parser & Builder Utility
 * Lightweight, dependency-free, and cross-platform compatible.
 */

export function parse(xml: string): Record<string, any> {
  const result: Record<string, any> = {};
  
  // Regex to match: <key>KeyName</key> <tag>Value</tag>
  const regex = /<key>([^<]+)<\/key>\s*<(string|integer|data|true|false)[^>]*>([^<]*)<\/\2>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const key = match[1];
    const type = match[2];
    const val = match[3];
    
    if (type === 'true') {
      result[key] = true;
    } else if (type === 'false') {
      result[key] = false;
    } else if (type === 'integer') {
      result[key] = parseInt(val, 10);
    } else {
      // Decode escaped XML entities
      const unescaped = val
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      result[key] = unescaped.trim();
    }
  }
  return result;
}

export function build(obj: any): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
  xml += '<plist version="1.0">\n';
  
  function renderValue(val: any, indent: string): string {
    if (val === null || val === undefined) {
      return `${indent}<string></string>\n`;
    }
    if (typeof val === 'boolean') {
      return `${indent}<${val}/>\n`;
    }
    if (typeof val === 'number') {
      return `${indent}<integer>${val}</integer>\n`;
    }
    if (typeof val === 'string') {
      const escaped = val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      return `${indent}<string>${escaped}</string>\n`;
    }
    if (Array.isArray(val)) {
      let subXml = `${indent}<array>\n`;
      for (const item of val) {
        subXml += renderValue(item, indent + '  ');
      }
      subXml += `${indent}</array>\n`;
      return subXml;
    }
    if (typeof val === 'object') {
      let subXml = `${indent}<dict>\n`;
      for (const [key, subVal] of Object.entries(val)) {
        subXml += `${indent}  <key>${key}</key>\n`;
        subXml += renderValue(subVal, indent + '  ');
      }
      subXml += `${indent}</dict>\n`;
      return subXml;
    }
    return `${indent}<string>${val}</string>\n`;
  }
  
  xml += renderValue(obj, '');
  xml += '</plist>';
  return xml;
}
