const WEBHOOK = 'https://secheron.bitrix24.com/rest/12/w55cr0u229xvmtul';

export async function bitrixCall(method, params = {}) {
  const url = `${WEBHOOK}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (json.error) {
    throw new Error(`Bitrix24 error [${method}]: ${json.error} — ${json.error_description || ''}`);
  }
  return json;
}
