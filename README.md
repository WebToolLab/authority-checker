# Domain Authority Checker (Free — No Moz Account Needed)

Checks a free Domain Authority-style score for any domain using
**OpenPageRank**, now hosted under Keywords Everywhere at
https://openpagerank.keywordseverywhere.com.

> **Note:** OpenPageRank used to live at domcop.com with a different API.
> It moved to Keywords Everywhere (same company - not a takeover), and old
> domcop.com keys stop working on **30 September 2026**. This tool targets
> the new API.

## What you get vs. Moz

| | OpenPageRank (this tool) | Moz's DA / PA / Spam Score |
|---|---|---|
| Cost | Free tier: 30,000 domains/month | Free tier is tiny; real use needs Moz Pro (~$99/mo) |
| Signup | Free Keywords Everywhere account | Moz account (+ paid plan for API) |
| Metric | 0–10 authority score, global rank, referring domains | DA (1–100), PA (1–100), Spam Score |
| Data source | Common Crawl-based index, spam-filtered | Moz's own link index |

This is a real, comparable "how authoritative is this domain" signal —
just not the exact same numbers Moz publishes. If you ever need the
literal DA/PA/Spam Score, that specifically requires a Moz account.

## 1. Get a free API key

1. Create a free account at https://keywordseverywhere.com (if you don't
   have one) and grab your Keywords Everywhere API key.
2. Go to https://openpagerank.keywordseverywhere.com and sign in with that
   key.
3. From the Dashboard, create a new **OpenPageRank API key** — that's the
   one this script actually uses.

## 2. Install

```bash
pip install requests
```

## 3. Set your key

```bash
export OPR_API_KEY="your-api-key"
```

## 4. Run it

```bash
python authority_checker.py example.com anotherdomain.com
python authority_checker.py --file domains.txt
python authority_checker.py example.com --csv results.csv
```

## Output
