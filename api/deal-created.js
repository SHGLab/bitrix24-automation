import { bitrixCall } from '../lib/bitrix.js';

const PROJECT_TENDER_ID = 1036;
const OFFER_NUMBER_FIELD = 'UF_CRM_1756303240';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const data = req.body;

  const dealId = parseInt(
    data?.data?.FIELDS?.ID ||
    data?.['data[FIELDS][ID]'] || 0
  );

  if (!dealId) return res.status(200).json({ error: 'No deal ID' });

  console.log(`Deal created: id=${dealId}`);

  try {
    // 1. Fetch the deal
    const dealJson = await bitrixCall('crm.deal.get', { id: dealId });
    const deal = dealJson?.result;
    if (!deal) return res.status(200).json({ error: 'Deal not found' });

    const tenderId = deal[`PARENT_ID_${PROJECT_TENDER_ID}`];
    if (!tenderId) {
      console.log(`Deal ${dealId} has no linked tender, skipping`);
      return res.status(200).json({ skipped: true });
    }

    // 2. Bidirectional link - write deal back to tender
    await bitrixCall('crm.item.update', {
      entityTypeId: PROJECT_TENDER_ID,
      id: parseInt(tenderId),
      fields: { parentId2: dealId },
    }).then(() => console.log(`Linked Deal ${dealId} -> Tender ${tenderId}`))
      .catch(e => console.error(`Reverse link failed: ${e.message}`));

    // 3. Fetch tender + company in parallel
    const [tenderJson, companyJson] = await Promise.all([
      bitrixCall('crm.item.get', { entityTypeId: PROJECT_TENDER_ID, id: parseInt(tenderId) }),
      deal.COMPANY_ID
        ? bitrixCall('crm.company.get', { id: parseInt(deal.COMPANY_ID) })
        : Promise.resolve(null),
    ]);

    const tenderTitle = tenderJson?.result?.item?.title || `Tender #${tenderId}`;
    const companyTitle = companyJson?.result?.TITLE || 'Unknown';

    console.log(`Tender: "${tenderTitle}", Company: "${companyTitle}"`);

    // 4. Count all deals linked to this tender
    const allDealsJson = await bitrixCall('crm.deal.list', {
      filter: { [`PARENT_ID_${PROJECT_TENDER_ID}`]: tenderId },
      select: ['ID'],
      order: { ID: 'ASC' },
    });
    const allDeals = allDealsJson?.result || [];

    const dealIndex = allDeals.findIndex(d => parseInt(d.ID) === dealId);
    const incrementalNumber = dealIndex >= 0 ? dealIndex + 1 : allDeals.length;
    const paddedNumber = String(incrementalNumber).padStart(3, '0');
    const currentYear = new Date().getFullYear();

    // 5. Build new title and offer number
    const newTitle = `OFFER - ${tenderTitle} - ${companyTitle}`;
    const offerNumber = `Secheron Offer-${currentYear}-${tenderId}-${paddedNumber}`;

    console.log(`New title: "${newTitle}"`);
    console.log(`Offer number: "${offerNumber}"`);

    // 6. Update the deal
    await bitrixCall('crm.deal.update', {
      id: dealId,
      fields: {
        TITLE: newTitle,
        [OFFER_NUMBER_FIELD]: offerNumber,
      },
    });

    console.log(`Deal ${dealId} renamed and offer number set`);
    return res.status(200).json({ success: true, dealId, newTitle, offerNumber });

  } catch(err) {
    console.error(`Error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
