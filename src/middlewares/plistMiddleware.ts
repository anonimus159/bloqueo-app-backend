import { Response, NextFunction } from 'express';
import * as plist from '../utils/plist';

export const rawBodyParser = (req: any, _res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if (
    contentType.includes('application/x-apple-aspen-mdm') || 
    contentType.includes('application/xml') ||
    contentType.includes('text/xml')
  ) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      try {
        const trimmed = data.trim();
        if (trimmed.startsWith('<?xml') || trimmed.startsWith('<plist') || trimmed.includes('<dict>')) {
          // Extraer la parte del XML si viene envuelto con firmas CMS/cryptográficas de Apple
          let plistXml = trimmed;
          const plistStartIndex = trimmed.indexOf('<?xml');
          const plistEndIndex = trimmed.indexOf('</plist>');
          if (plistStartIndex !== -1 && plistEndIndex !== -1) {
            plistXml = trimmed.substring(plistStartIndex, plistEndIndex + 8);
          }
          req.body = plist.parse(plistXml);
        }
      } catch (err) {
        console.error('Error parseando XML Plist:', err);
      }
      next();
    });
  } else {
    next();
  }
};
