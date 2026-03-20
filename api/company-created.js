import { bitrixCall } from '../lib/bitrix.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const data = req.body;

  const companyId = parseInt(
    data?.data?.FIELDS?.ID ||
    data?.['data[FIELDS][ID]'] || 0
  );

  if (!companyId) return res.status(200).json({ error: 'No company ID' });

  console.log(`📥 Company created: id=${companyId}`);

  try {
    // 1. Fetch the new company
    const companyJson = await bitrixCall('crm.company.get', { id: companyId });
    const company = companyJson?.result;
    if (!company) return res.status(200).json({ error: 'Company not found' });

    const companyTitle = company.TITLE?.trim();
    if (!companyTitle) return res.status(200).json({ skipped: true, reason: 'no title' });

    console.log(`🔍 Searching for duplicates of "${companyTitle}"`);

    // 2. Search for existing companies with exact same name
    const searchJson = await bitrixCall('crm.company.list', {
      filter: { TITLE: companyTitle },
      select: ['ID', 'TITLE'],
    });

    const matches = (searchJson?.result || []).filter(c => parseInt(c.ID) !== companyId);

    if (matches.length === 0) {
      console.log(`✅ No duplicates found for "${companyTitle}"`);
      return res.status(200).json({ success: true, unique: true, companyId });
    }

    // 3. Found duplicates — keep the oldest one (lowest ID), merge rest into it
    const allIds = [companyId, ...matches.map(c => parseInt(c.ID))];
    allIds.sort((a, b) => a - b);
    const keepId = allIds[0];
    const mergeIds = allIds.filter(id => id !== keepId);

    console.log(`🔀 Merging ${mergeIds.join(', ')} into ${keepId}`);

    // 4. Re-link all contacts from duplicate companies to the kept company
    for (const dupeId of mergeIds) {
      // Get contacts linked to duplicate
      const contactsJson = await bitrixCall('crm.contact.list', {
        filter: { COMPANY_ID: dupeId },
        select: ['ID'],
      });
      const contacts = contactsJson?.result || [];

      // Re-link each contact to the kept company
      await Promise.all(contacts.map(contact =>
        bitrixCall('crm.contact.update', {
          id: parseInt(contact.ID),
          fields: { COMPANY_ID: keepId },
        }).then(() => console.log(`✅ Contact ${contact.ID} re-linked to company ${keepId}`))
          .catch(e => console.error(`❌ Contact re-link failed:`, e.message))
      ));

      // Re-link deals
      const dealsJson = await bitrixCall('crm.deal.list', {
        filter: { COMPANY_ID: dupeId },
        select: ['ID'],
      });
      const deals = dealsJson?.result || [];

      await Promise.all(deals.map(deal =>
        bitrixCall('crm.deal.update', {
          id: parseInt(deal.ID),
          fields: { COMPANY_ID: keepId },
        }).then(() => console.log(`✅ Deal ${deal.ID} re-linked to company ${keepId}`))
          .catch(e => console.error(`❌ Deal re-link failed:`, e.message))
      ));

      // Delete the duplicate company
      await bitrixCall('crm.company.delete', { id: dupeId })
        .then(() => console.log(`🗑️ Deleted duplicate company ${dupeId}`))
        .catch(e => console.error(`❌ Delete failed for ${dupeId}:`, e.message));
    }

    console.log(`✅ Merge complete. Kept company ${keepId} "${companyTitle}"`);
    return res.status(200).json({ success: true, keepId, mergedIds: mergeIds });

  } catch(err) {
    console.error('🔥 Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
