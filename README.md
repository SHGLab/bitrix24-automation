# Bitrix24 Automation — Sécheron

Vercel webhook handlers for Bitrix24 CRM automation.

## Project Structure

```
bitrix24-automation/
├── api/
│   └── deal-created.js        # Webhook: fires when a Deal is created
├── lib/
│   └── bitrix.js              # Bitrix24 REST API helper functions
├── .env.example               # Environment variable template
├── vercel.json                # Vercel config
└── package.json
```

## Automations Included

| File | Trigger | What it does |
|------|---------|--------------|
| `api/deal-created.js` | `ONCRMDEALADD` | Links Deal back to Project Tender and/or STSR |

## Deployment

### 1. Push to GitHub
Push this folder to a GitHub repository.

### 2. Import to Vercel
- Go to [vercel.com](https://vercel.com)
- New Project → Import your GitHub repo
- Framework: **Other**

### 3. Set Environment Variables
In Vercel → Project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `BITRIX_WEBHOOK_URL` | `https://secheron.bitrix24.com/rest/12/w55cr0u229xvmtul` |

### 4. Get your Handler URL
After deploy, your webhook URL will be:
```
https://YOUR-PROJECT.vercel.app/api/deal-created
```

### 5. Register in Bitrix24
Go to Developer Resources → Outbound Webhooks:
- **Event:** `ONCRMDEALADD`
- **Handler URL:** paste your Vercel URL above

## Entity Type IDs

| Entity | entityTypeId |
|--------|-------------|
| Deal (CRM) | 2 |
| Project Tender (SPA) | 1036 |
| STSR (SPA) | 1090 |
