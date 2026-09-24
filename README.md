# Mangrove Graduate Navigator — public web application

Mangrove Graduate Navigator is a Mangrove Intelligence product.

This repository contains the **public browser application only**. The recommendation engine, paid-report personalization engine, country calibration, payment verification, private research systems, and user data are intentionally excluded and remain in private Mangrove infrastructure.

## Architecture

```
PUBLIC WEB
UI + bilingual presentation + public API contracts + frontend CI

        ↓ authenticated HTTPS

PRIVATE MANGROVE CORE
recommendation + report personalization + regional adapters + payments

        ↓

PRIVATE DATABASE
assessment responses + consent + report payloads + research/payment records
```

The public repository is built from a clean export. It is **not** a public copy of the original private development repository or its history.

## Current status

This repository is being prepared as the future public Cloudflare Pages shell. The `cloudflare-api-cutover` branch routes proprietary result/report calls through Mangrove's private API gateway. It is **not yet the production deployment source** for graduate.mangroveintel.com.

## Security

Never commit credentials, user exports, research contacts, payment records, private operational data, recommendation weights/thresholds, or private report-generation rules.

## Commercial reuse

Public source availability does not grant permission to clone, redistribute, or commercially reproduce the service. See `LICENSE`.
