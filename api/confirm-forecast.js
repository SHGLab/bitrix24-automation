import { bitrixCall } from '../lib/bitrix.js';

const FORECAST_DEAL_STAGE = 'PREPAYMENT_INVOICE';
const LOST_DEAL_STAGE = 'LOSE';
const COMPONENT_ENTITY_TYPE = 1040;
const PROJECT_TENDER_ID = 1036;
const COMPONENT_FORECAST_STAGE = 'DT1040_11:CLIENT';

// Field codes
const TENDER_POWER_CONVERSION = 'ufCrm6_1750245175';
const TENDER_HOT = 'ufCrm6_1753716136';
const COMPONENT_HOT = 'ufCrm7_1767785873';
const COMPONENT_POWER_CONVERSION = 'ufCrm7_1752648716';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { tenderId, selectedDealId, allDealIds } = req.body;
  if (!tenderId || !selectedDealId || !allDealIds) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`🎯 Forecast confirmation: Tender ${tenderId}, Selected Deal ${selectedDealId}`);

    // 1. Fetch deal + tender in parallel
    const [dealJson, tenderJson] = await Promise.all([
      bitrixCall('crm.deal.get', { id: parseInt(selectedDealId) }),
      bitrixCall('crm.item.get', { entityTypeId: PROJECT_TENDER_ID, id: parseInt(tenderId) }),
    ]);

    const deal = dealJson?.result;
    const tender = tenderJson?.result?.item;
    if (!deal) throw new Error(`Deal ${selectedDealId} not found`);
    if (!tender) throw new Error(`Tender ${tenderId} not found`);

    const dealTitle = deal.TITLE || `Deal #${selectedDealId}`;
    const responsibleId = deal.ASSIGNED_BY_ID;
    console.log(`📋 Deal: "${dealTitle}", Responsible: ${responsibleId}`);

    // 2. Move selected deal to Forecast
    await bitrixCall('crm.deal.update', {
      id: parseInt(selectedDealId),
      fields: { STAGE_ID: FORECAST_DEAL_STAGE },
    });
    console.log(`✅ Deal ${selectedDealId} → Forecast`);

    // 3. Move all other deals to Lost
    const otherDeals = allDealIds.filter(id => String(id) !== String(selectedDealId));
    await Promise.all(otherDeals.map(dealId =>
      bitrixCall('crm.deal.update', {
        id: parseInt(dealId),
        fields: { STAGE_ID: LOST_DEAL_STAGE },
      }).then(() => console.log(`✅ Deal ${dealId} → Lost`))
        .catch(e => console.error(`❌ Deal ${dealId} failed:`, e.message))
    ));

    // 4. Build component fields
    const componentFields = {
      title: `Component - ${dealTitle}`,
      stageId: COMPONENT_FORECAST_STAGE,
      [`parentId${PROJECT_TENDER_ID}`]: parseInt(tenderId),

      // From deal
      opportunity: deal.OPPORTUNITY || null,
      currencyId: deal.CURRENCY_ID || 'CHF',
      companyId: deal.COMPANY_ID ? parseInt(deal.COMPANY_ID) : null,
      contactId: deal.CONTACT_ID ? parseInt(deal.CONTACT_ID) : null,

      // From tender
      [COMPONENT_POWER_CONVERSION]: tender[TENDER_POWER_CONVERSION] || null,
      [COMPONENT_HOT]: tender[TENDER_HOT] || null,
    };

    // Add responsible person
    if (responsibleId) {
      componentFields.assignedById = parseInt(responsibleId);
    }

    // Remove null fields
    Object.keys(componentFields).forEach(k => {
      if (componentFields[k] === null || componentFields[k] === undefined) {
        delete componentFields[k];
      }
    });

    console.log(`📦 Creating component with fields:`, JSON.stringify(componentFields));

    // 5. Create component
    const componentJson = await bitrixCall('crm.item.add', {
      entityTypeId: COMPONENT_ENTITY_TYPE,
      fields: componentFields,
    });

    const newComponentId = componentJson?.result?.item?.id;
    console.log(`✅ Component #${newComponentId} created: "${componentFields.title}"`);

    // 6. Return component URL for redirect
    const componentUrl = `https://secheron.bitrix24.com/crm/type/${COMPONENT_ENTITY_TYPE}/details/${newComponentId}/`;

    return res.status(200).json({
      success: true,
      selectedDealId,
      lostDeals: otherDeals,
      componentId: newComponentId,
      componentUrl,
    });

  } catch(err) {
    console.error('🔥 Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
