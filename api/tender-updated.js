import { bitrixCall } from '../lib/bitrix.js';

const PROJECT_TENDER_ID = 1036;
const COMPONENT_ENTITY_TYPE = 1040;
const FORECAST_TENDER_STAGE = 'DT1036_10:CLIENT';
const DEAL_SELECTOR_URL = 'https://bitrix24-automation-tan.vercel.app/deal-selector';

// ── Quarter field codes ──────────────────────────────────────
const TENDER_EXPECTED_QUARTER = 'ufCrm6_1750238566';
const TENDER_DELIVERY_QUARTER = 'ufCrm6_1750245275';
const COMPONENT_EXPECTED_QUARTER = 'ufCrm_6996E7169C0D1';
const COMPONENT_DELIVERY_QUARTER = 'ufCrm_6996E716B5A44';

// ── Stage maps ───────────────────────────────────────────────
const TENDER_TO_DEAL_STAGE = {
  'DT1036_10:UC_0MOX2W': 'UC_MK8AJG',
  'DT1036_10:NEW':        'NEW',
  'DT1036_10:PREPARATION':'PREPARATION',
  'DT1036_10:CLIENT':     'PREPAYMENT_INVOICE',
  'DT1036_10:SUCCESS':    'WON',
  'DT1036_10:FAIL':       'LOSE',
  'DT1036_10:1':          'LOSE',
  'DT1036_10:2':          'LOSE',
};

const TENDER_TO_COMPONENT_STAGE = {
  'DT1036_10:UC_0MOX2W': 'DT1040_11:NEW',
  'DT1036_10:NEW':        'DT1040_11:PREPARATION',
  'DT1036_10:PREPARATION':'DT1040_11:UC_9M4N4P',
  'DT1036_10:CLIENT':     'DT1040_11:CLIENT',
  'DT1036_10:SUCCESS':    'DT1040_11:SUCCESS',
  'DT1036_10:FAIL':       'DT1040_11:FAIL',
  'DT1036_10:1':          'DT1040_11:1',
  'DT1036_10:2':          'DT1040_11:2',
};

// ── Quarter maps ─────────────────────────────────────────────
const TENDER_EXPECTED_MAP = {
  3412:'2025 Q2',3414:'2025 Q3',3416:'2025 Q4',
  3418:'2026 Q1',3420:'2026 Q2',3422:'2026 Q3',3424:'2026 Q4',
  3426:'2027 Q1',3428:'2027 Q2',3430:'2027 Q3',3432:'2027 Q4',
  3434:'2028 Q1',3436:'2028 Q2',3438:'2028 Q3',3440:'2028 Q4',
  3442:'2029 Q1',3444:'2029 Q2',3446:'2029 Q3',3448:'2029 Q4',
  3450:'2030 Q1',3452:'2030 Q2',3454:'2030 Q3',3456:'2030 Q4',
  7463:'2031 Q1',7465:'2031 Q2',7467:'2031 Q3',7469:'2031 Q4',
  7471:'2032 Q1',7473:'2032 Q2',7475:'2032 Q3',7477:'2032 Q4',
  7479:'2033 Q1',7481:'2033 Q2',7483:'2033 Q3',7485:'2033 Q4',
  7487:'2034 Q1',7489:'2034 Q2',7491:'2034 Q3',7493:'2034 Q4',
  7495:'2035 Q1',7497:'2035 Q2',7499:'2035 Q3',7501:'2035 Q4',
  7503:'2036 Q1',7505:'2036 Q2',7507:'2036 Q3',7509:'2036 Q4',
  7511:'2037 Q1',7513:'2037 Q2',7515:'2037 Q3',7517:'2037 Q4',
};

const TENDER_DELIVERY_MAP = {
  '2025 Q2':4084,'2025 Q3':4086,'2025 Q4':4088,
  '2026 Q1':4090,'2026 Q2':4092,'2026 Q3':4094,'2026 Q4':4096,
  '2027 Q1':4098,'2027 Q2':4100,'2027 Q3':4102,'2027 Q4':4104,
  '2028 Q1':4106,'2028 Q2':4108,'2028 Q3':4110,'2028 Q4':4112,
  '2029 Q1':4114,'2029 Q2':4116,'2029 Q3':4118,'2029 Q4':4120,
  '2030 Q1':4122,'2030 Q2':4124,'2030 Q3':4126,'2030 Q4':4128,
  '2031 Q1':4130,'2031 Q2':4132,'2031 Q3':4134,'2031 Q4':4136,
  '2032 Q1':4138,'2032 Q2':4140,'2032 Q3':4142,'2032 Q4':4144,
  '2033 Q1':4146,'2033 Q2':4148,'2033 Q3':4150,'2033 Q4':4152,
  '2034 Q1':4162,'2034 Q2':4164,'2034 Q3':4166,'2034 Q4':4168,
  '2035 Q1':4154,'2035 Q2':4156,'2035 Q3':4158,'2035 Q4':4160,
  '2036 Q1':7527,'2036 Q2':7529,'2036 Q3':7531,'2036 Q4':7533,
  '2037 Q1':7535,'2037 Q2':7537,'2037 Q3':7539,'2037 Q4':7541,
};

const COMPONENT_EXPECTED_MAP = {
  '2024 Q1':7563,'2024 Q2':7565,'2024 Q3':7567,'2024 Q4':7569,
  '2025 Q1':7571,'2025 Q2':7573,'2025 Q3':7575,'2025 Q4':7577,
  '2026 Q1':7579,'2026 Q2':7581,'2026 Q3':7583,'2026 Q4':7585,
  '2027 Q1':7587,'2027 Q2':7589,'2027 Q3':7591,'2027 Q4':7593,
  '2028 Q1':7595,'2028 Q2':7597,'2028 Q3':7599,'2028 Q4':7601,
  '2029 Q1':7603,'2029 Q2':7605,'2029 Q3':7607,'2029 Q4':7609,
  '2030 Q1':7611,'2030 Q2':7613,'2030 Q3':7615,'2030 Q4':7617,
  '2031 Q1':7619,'2031 Q2':7621,'2031 Q3':7623,'2031 Q4':7625,
  '2032 Q1':7627,'2032 Q2':7629,'2032 Q3':7631,'2032 Q4':7633,
  '2033 Q1':7635,'2033 Q2':7637,'2033 Q3':7639,'2033 Q4':7641,
  '2034 Q1':7651,'2034 Q2':7653,'2034 Q3':7655,'2034 Q4':7657,
  '2035 Q1':7643,'2035 Q2':7645,'2035 Q3':7647,'2035 Q4':7649,
};

const COMPONENT_DELIVERY_MAP = {
  '2024 Q1':7659,'2024 Q2':7661,'2024 Q3':7663,'2024 Q4':7665,
  '2025 Q1':7667,'2025 Q2':7669,'2025 Q3':7671,'2025 Q4':7673,
  '2026 Q1':7675,'2026 Q2':7677,'2026 Q3':7679,'2026 Q4':7681,
  '2027 Q1':7683,'2027 Q2':7685,'2027 Q3':7687,'2027 Q4':7689,
  '2028 Q1':7691,'2028 Q2':7693,'2028 Q3':7695,'2028 Q4':7697,
  '2029 Q1':7699,'2029 Q2':7701,'2029 Q3':7703,'2029 Q4':7705,
  '2030 Q1':7707,'2030 Q2':7709,'2030 Q3':7711,'2030 Q4':7713,
  '2031 Q1':7715,'2031 Q2':7717,'2031 Q3':7719,'2031 Q4':7721,
  '2032 Q1':7723,'2032 Q2':7725,'2032 Q3':7727,'2032 Q4':7729,
  '2033 Q1':7731,'2033 Q2':7733,'2033 Q3':7735,'2033 Q4':7737,
  '2034 Q1':7747,'2034 Q2':7749,'2034 Q3':7751,'2034 Q4':7753,
  '2035 Q1':7739,'2035 Q2':7741,'2035 Q3':7743,'2035 Q4':7745,
};

const QUARTER_ORDER = [
  '2024 Q1','2024 Q2','2024 Q3','2024 Q4',
  '2025 Q1','2025 Q2','2025 Q3','2025 Q4',
  '2026 Q1','2026 Q2','2026 Q3','2026 Q4',
  '2027 Q1','2027 Q2','2027 Q3','2027 Q4',
  '2028 Q1','2028 Q2','2028 Q3','2028 Q4',
  '2029 Q1','2029 Q2','2029 Q3','2029 Q4',
  '2030 Q1','2030 Q2','2030 Q3','2030 Q4',
  '2031 Q1','2031 Q2','2031 Q3','2031 Q4',
  '2032 Q1','2032 Q2','2032 Q3','2032 Q4',
  '2033 Q1','2033 Q2','2033 Q3','2033 Q4',
  '2034 Q1','2034 Q2','2034 Q3','2034 Q4',
  '2035 Q1','2035 Q2','2035 Q3','2035 Q4',
  '2036 Q1','2036 Q2','2036 Q3','2036 Q4',
  '2037 Q1','2037 Q2','2037 Q3','2037 Q4',
];

// ── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const data = req.body;
  const entityTypeId = parseInt(
    data?.data?.FIELDS?.ENTITY_TYPE_ID ||
    data?.['data[FIELDS][ENTITY_TYPE_ID]'] || 0
  );

  if (entityTypeId !== PROJECT_TENDER_ID) {
    return res.status(200).json({ skipped: true, entityTypeId });
  }

  const tenderId = parseInt(
    data?.data?.FIELDS?.ID ||
    data?.['data[FIELDS][ID]'] || 0
  );

  if (!tenderId) return res.status(200).json({ error: 'No tender ID' });

  console.log(`📥 Tender updated: id=${tenderId}`);

  try {
    const tenderJson = await bitrixCall('crm.item.get', {
      entityTypeId: PROJECT_TENDER_ID,
      id: tenderId,
    });
    const tender = tenderJson?.result?.item;
    if (!tender) return res.status(200).json({ error: 'Tender not found' });

    const tenderStageId = tender.stageId || tender.STAGE_ID || tender.stage_id;
    const expectedQuarterId = tender[TENDER_EXPECTED_QUARTER];

    console.log(`📊 Tender stage: ${tenderStageId}`);
    console.log(`📅 Expected quarter ID: ${expectedQuarterId}`);

    await Promise.all([
      syncStages(tenderId, tenderStageId, tender),
      syncQuarters(tenderId, expectedQuarterId),
    ]);

    return res.status(200).json({ success: true, tenderId, tenderStageId });

  } catch (err) {
    console.error('🔥 Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── Stage cascade ─────────────────────────────────────────────
async function syncStages(tenderId, tenderStageId, tender) {
  if (!tenderStageId) return;

  const dealStageId = TENDER_TO_DEAL_STAGE[tenderStageId];
  const componentStageId = TENDER_TO_COMPONENT_STAGE[tenderStageId];

  if (!dealStageId) {
    console.log(`⚠️ No stage mapping for tender stage: ${tenderStageId}`);
    return;
  }

  console.log(`🔄 Cascading stage → Deal: ${dealStageId}, Component: ${componentStageId}`);

  // If moving to Forecast → send deal selector notification instead of auto-updating deals
  if (tenderStageId === FORECAST_TENDER_STAGE) {
    await notifyForecastSelection(tenderId, tender);
    // Still update components
    await syncComponents(tenderId, componentStageId);
    return;
  }

  // Get all linked Deals
  const dealsJson = await bitrixCall('crm.deal.list', {
    filter: { [`PARENT_ID_${PROJECT_TENDER_ID}`]: tenderId },
    select: ['ID'],
  });
  const deals = dealsJson?.result || [];
  console.log(`📋 Found ${deals.length} linked deals`);

  // Update all deals
  await Promise.all(deals.map(deal =>
    bitrixCall('crm.deal.update', {
      id: deal.ID,
      fields: { STAGE_ID: dealStageId },
    }).then(() => console.log(`✅ Deal ${deal.ID} → ${dealStageId}`))
      .catch(e => console.error(`❌ Deal ${deal.ID} failed:`, e.message))
  ));

  // Update all components
  await syncComponents(tenderId, componentStageId);
}

// ── Sync components stage ─────────────────────────────────────
async function syncComponents(tenderId, componentStageId) {
  if (!componentStageId) return;

  const componentsJson = await bitrixCall('crm.item.list', {
    entityTypeId: COMPONENT_ENTITY_TYPE,
    filter: { '=parentId1036': tenderId },
    select: ['id'],
  });
  const components = componentsJson?.result?.items || [];
  console.log(`📋 Found ${components.length} linked components`);

  await Promise.all(components.map(comp =>
    bitrixCall('crm.item.update', {
      entityTypeId: COMPONENT_ENTITY_TYPE,
      id: comp.id,
      fields: { stageId: componentStageId },
    }).then(() => console.log(`✅ Component ${comp.id} → ${componentStageId}`))
      .catch(e => console.error(`❌ Component ${comp.id} failed:`, e.message))
  ));
}

// ── Forecast notification ─────────────────────────────────────
async function notifyForecastSelection(tenderId, tender) {
  const assignedId = tender?.assignedById;
  const tenderTitle = tender?.title || `Tender #${tenderId}`;

  // Direct link — opens deal selector in a new browser tab
  const directUrl = `${DEAL_SELECTOR_URL}?tenderId=${tenderId}`;

  console.log(`🎯 Tender reached Forecast — sending deal selector notification`);

  if (assignedId) {
    await bitrixCall('im.notify.system.add', {
      USER_ID: assignedId,
      MESSAGE: `🎯 [B]Action required — ${tenderTitle}[/B][BR][BR]This tender has reached [B]Forecast[/B] stage. You must select which deal moves forward.[BR][BR][URL=${directUrl}]→ Open Deal Selector[/URL]`,
    }).catch(e => console.error('Notification failed:', e.message));
    console.log(`📨 Notification sent to user ${assignedId}`);
  }

  // Timeline comment on the tender — visible directly in the record
  await bitrixCall('crm.timeline.comment.add', {
    fields: {
      ENTITY_TYPE: 'dynamic_1036',
      ENTITY_ID: tenderId,
      COMMENT: `🎯 Forecast stage reached. Deal selection required.[BR][URL=${directUrl}]→ Open Deal Selector[/URL]`,
    },
  }).catch(e => console.error('Timeline comment failed:', e.message));
}

// ── Quarter sync ──────────────────────────────────────────────
async function syncQuarters(tenderId, expectedQuarterId) {
  if (!expectedQuarterId) return;

  const expectedLabel = TENDER_EXPECTED_MAP[parseInt(expectedQuarterId)];
  if (!expectedLabel) return;

  const idx = QUARTER_ORDER.indexOf(expectedLabel);
  const deliveryLabel = (idx !== -1 && idx + 3 < QUARTER_ORDER.length)
    ? QUARTER_ORDER[idx + 3]
    : null;

  if (!deliveryLabel) return;

  const deliveryTenderId = TENDER_DELIVERY_MAP[deliveryLabel];

  if (deliveryTenderId) {
    await bitrixCall('crm.item.update', {
      entityTypeId: PROJECT_TENDER_ID,
      id: tenderId,
      fields: { [TENDER_DELIVERY_QUARTER]: deliveryTenderId },
    });
    console.log(`✅ Tender delivery quarter → ${deliveryLabel}`);
  }

  const componentsJson = await bitrixCall('crm.item.list', {
    entityTypeId: COMPONENT_ENTITY_TYPE,
    filter: { '=parentId1036': tenderId },
    select: ['id'],
  });
  const components = componentsJson?.result?.items || [];

  const componentExpectedId = COMPONENT_EXPECTED_MAP[expectedLabel];
  const componentDeliveryId = COMPONENT_DELIVERY_MAP[deliveryLabel];

  await Promise.all(components.map(comp =>
    bitrixCall('crm.item.update', {
      entityTypeId: COMPONENT_ENTITY_TYPE,
      id: comp.id,
      fields: {
        [COMPONENT_EXPECTED_QUARTER]: componentExpectedId,
        [COMPONENT_DELIVERY_QUARTER]: componentDeliveryId,
      },
    }).catch(e => console.error(`❌ Component ${comp.id} quarter sync failed:`, e.message))
  ));

  if (components.length > 0) {
    console.log(`✅ Synced quarters to ${components.length} components: ${expectedLabel} / ${deliveryLabel}`);
  }
}
