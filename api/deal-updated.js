import { bitrixCall } from '../lib/bitrix.js';

const PROJECT_TENDER_ID = 1036;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const data = req.body;

  // Extract deal ID from webhook payload
  const dealId = parseInt(
    data?.data?.FIELDS?.ID ||
    data?.['data[FIELDS][ID]'] || 0
  );

  if (!dealId) return res.status(200).json({ error: 'No deal ID' });

  console.log(`📥 Deal updated/created: id=${dealId}`);

  try {
    // 1. Get the deal to find its linked tender
    const dealJson = await bitrixCall('crm.deal.get', { id: dealId });
    const deal = dealJson?.result;
    if (!deal) return res.status(200).json({ error: 'Deal not found' });

    const tenderId = deal[`PARENT_ID_${PROJECT_TENDER_ID}`];
    if (!tenderId) {
      console.log(`⏭️ Deal ${dealId} has no linked tender, skipping`);
      return res.status(200).json({ skipped: true });
    }

    console.log(`🔗 Deal ${dealId} linked to Tender ${tenderId}`);

    // 2. Get ALL deals linked to this tender
    const allDealsJson = await bitrixCall('crm.deal.list', {
      filter: { [`PARENT_ID_${PROJECT_TENDER_ID}`]: tenderId },
      select: ['ID', 'OPPORTUNITY', 'CURRENCY_ID', 'STAGE_ID'],
    });
    const allDeals = allDealsJson?.result || [];
    console.log(`📋 Found ${allDeals.length} deals linked to Tender ${tenderId}`);

    // 3. Filter out lost deals from the average
    const LOST_STAGES = ['LOSE', 'APOLOGY', '1', '2', '3'];
    const activeDeals = allDeals.filter(d => !LOST_STAGES.includes(d.STAGE_ID));
    console.log(`📊 Active deals (not lost): ${activeDeals.length}`);

    if (activeDeals.length === 0) {
      console.log(`⏭️ No active deals, skipping tender update`);
      return res.status(200).json({ skipped: true, reason: 'no active deals' });
    }

    // 4. Compute average of active deals with a value
    const dealsWithValue = activeDeals.filter(d => parseFloat(d.OPPORTUNITY) > 0);
    if (dealsWithValue.length === 0) {
      console.log(`⏭️ No deals with value, skipping`);
      return res.status(200).json({ skipped: true, reason: 'no deals with value' });
    }

    const total = dealsWithValue.reduce((sum, d) => sum + parseFloat(d.OPPORTUNITY), 0);
    const average = Math.round(total / dealsWithValue.length);
    const currency = dealsWithValue[0].CURRENCY_ID || 'CHF';

    console.log(`💰 Total: ${total}, Count: ${dealsWithValue.length}, Average: ${average} ${currency}`);

    // 5. Update the tender opportunity
    await bitrixCall('crm.item.update', {
      entityTypeId: PROJECT_TENDER_ID,
      id: parseInt(tenderId),
      fields: {
        opportunity: average,
        currencyId: currency,
      },
    });

    console.log(`✅ Tender ${tenderId} opportunity updated → ${average} ${currency}`);
    return res.status(200).json({ success: true, tenderId, average, currency });

  } catch(err) {
    console.error('🔥 Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
