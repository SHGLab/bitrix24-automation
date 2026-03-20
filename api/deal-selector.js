import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  const html = readFileSync(join(process.cwd(), 'public', 'deal-selector.html'), 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', 'frame-ancestors *');
  res.status(200).send(html);
}
