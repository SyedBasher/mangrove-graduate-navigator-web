# Public browser-to-private-core contract

The browser may submit an authenticated assessment session identifier to Mangrove's private API and receive only user-facing output.

The public API must never return recommendation weights, thresholds, target vectors, internal component scores, private reason codes, report-generation rules, payment credentials, or private research data.

Planned regional context uses ISO-like product codes `BD`, `IN`, and `PK`. Country context may alter practical/localized layers only where supported by evidence; it does not arbitrarily change core capability measurement.
