import { bitrixCall } from '../lib/bitrix.js';
import {
  TENDER_EXPECTED_QUARTER,
  COMPONENT_EXPECTED_QUARTER,
  COMPONENT_DELIVERY_QUARTER,
  resolveComponentQuarters,
} from '../lib/quarters.js';

const PROJECT_TENDER_ID = 1036;
const COMPONENT_ENTITY_TYPE = 1040;
const TRACKED_ENTITIES = [1090, 1040, 1044, 1064, 1100];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const data = req.body;

  const entityTypeId = parseInt(
    data?.data?.FIELDS?.ENTITY_TYPE_ID ||
    data?.['data[FIELDS][ENTITY_TYPE_ID]'] || 0
  );

  const itemId = parseInt(
    data?.data?.FIELDS?.ID ||
    data?.['data[FIELDS][ID]'] || 0
  );

  console.log(`SPA created: entityTypeId=${entityTypeId}, itemId=${itemId}`);

  if (!TRACKED_ENTITIES.includes(entityTypeId)) {
    return res.status(200).json({ skipped: true, entityTypeId });
  }

  if (!itemId) return res.status(200).json({ error: 'No item ID' });

  try {
    // 1. Read the new SPA item
    const json = await bitrixCall('crm.item.get', { entityTypeId, id: itemId });
    const item = json?.result?.item;
    if (!item) return res.status(200).json({ error: 'Item not found' });

    const linkedTenderId = item.parentId1036;
    const linkedDealId = item.parentId2;

    console.log(`Parents -> Tender: ${linkedTenderId}, Deal: ${linkedDealId}`);

    // 2. Bidirectional linking - write back to tender
    if (linkedTenderId) {
      await bitrixCall('crm.item.update', {
        entityTypeId: PROJECT_TENDER_ID,
        id: parseInt(linkedTenderId),
        fields: { [`parentId${entityTypeId}`]: itemId },
      }).then(() => console.log(`Linked ${entityTypeId}/${itemId} -> Tender ${linkedTenderId}`))
        .catch(e => console.error(`Reverse link to tender failed: ${e.message}`));
    }

    // 3. Bidirectional linking - write back to deal
    if (linkedDealId) {
      await bitrixCall('crm.deal.update', {
        id: parseInt(linkedDealId),
        fields: { [`PARENT_ID_${entityTypeId}`]: itemId },
      }).then(() => console.log(`Linked ${entityTypeId}/${itemId} -> Deal ${linkedDealId}`))
        .catch(e => console.error(`Reverse link to deal failed: ${e.message}`));
    }

    // 4. Component-specific: naming + field population
    if (entityTypeId === COMPONENT_ENTITY_TYPE) {
      const updateFields = {};
      let newTitle = null;

      // Created from a Deal
      if (linkedDealId) {
        const dealJson = await bitrixCall('crm.deal.get', { id: parseInt(linkedDealId) });
        const deal = dealJson?.result;
        if (deal) {
          newTitle = `COMPONENTS - ${deal.TITLE || `Deal #${linkedDealId}`}`;
          if (deal.OPPORTUNITY) updateFields.opportunity = parseFloat(deal.OPPORTUNITY);
          if (deal.CURRENCY_ID) updateFields.currencyId = deal.CURRENCY_ID;
          if (deal.COMPANY_ID) updateFields.companyId = parseInt(deal.COMPANY_ID);
          if (deal.CONTACT_ID) updateFields.contactId = parseInt(deal.CONTACT_ID);
          console.log(`Copied from deal: amount=${deal.OPPORTUNITY}, company=${deal.COMPANY_ID}`);

          // Get tender quarters via the deal's linked tender
          const tenderIdFromDeal = deal[`PARENT_ID_${PROJECT_TENDER_ID}`];
          if (tenderIdFromDeal && !linkedTenderId) {
            await applyTenderQuarters(tenderIdFromDeal, updateFields);
          }
        }
      }

      // Created from Project Tender
      if (!newTitle && linkedTenderId) {
        const tenderJson = await bitrixCall('crm.item.get', {
          entityTypeId: PROJECT_TENDER_ID,
          id: parseInt(linkedTenderId),
        });
        const tender = tenderJson?.result?.item;
        if (tender) {
          newTitle = `COMPONENTS - ${tender.title || `Tender #${linkedTenderId}`}`;
          if (tender.companyId) updateFields.companyId = parseInt(tender.companyId);
          console.log(`Copied from tender: company=${tender.companyId}`);
        }
      }

      // Apply quarters from linked tender
      if (linkedTenderId) {
        await applyTenderQuarters(linkedTenderId, updateFields);
      }

      if (newTitle) updateFields.title = newTitle;

      if (Object.keys(updateFields).length > 0) {
        await bitrixCall('crm.item.update', {
          entityTypeId: COMPONENT_ENTITY_TYPE,
          id: itemId,
          fields: updateFields,
        });
        console.log(`Component ${itemId} updated: "${newTitle}"`);
      }
    }

    return res.status(200).json({ success: true, entityTypeId, itemId, linkedTenderId, linkedDealId });

  } catch(err) {
    console.error(`Error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

async function applyTenderQuarters(tenderId, updateFields) {
  try {
    const tenderJson = await bitrixCall('crm.item.get', {
      entityTypeId: PROJECT_TENDER_ID,
      id: parseInt(tenderId),
    });
    const tender = tenderJson?.result?.item;
    if (!tender) return;

    const quarters = resolveComponentQuarters(tender[TENDER_EXPECTED_QUARTER]);
    if (quarters) {
      updateFields[COMPONENT_EXPECTED_QUARTER] = quarters.componentExpectedId;
      updateFields[COMPONENT_DELIVERY_QUARTER] = quarters.componentDeliveryId;
      console.log(`Quarters: ${quarters.expectedLabel} / ${quarters.deliveryLabel}`);
    }
  } catch(e) {
    console.error(`Quarter sync failed: ${e.message}`);
  }
}
