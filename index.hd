#!/usr/bin/env python3
"""
Domain Authority Checker (free, no Moz account needed)
=======================================================
Checks a free, independent Domain Authority-style score for one or more
domains using the OpenPageRank API, now run under Keywords Everywhere at
https://openpagerank.keywordseverywhere.com (OpenPageRank moved here from
its old home at domcop.com; old keys stop working 30 September 2026).

WHAT THIS GIVES YOU
--------------------
A 0-10 PageRank-style authority score, a global rank, and a referring-
domains count for each domain, built from OpenPageRank's own Common
Crawl-based web graph with spam filtering applied. This is NOT Moz's
exact DA / PA / Spam Score - those specific numbers only come from Moz's
own API - but it's a real, comparable "how authoritative is this domain"
signal, and it's free.

SETUP (free)
------------
1. Create a free Keywords Everywhere account (if you don't have one) at
   https://keywordseverywhere.com and grab your Keywords Everywhere API key.
2. Go to https://openpagerank.keywordseverywhere.com and sign in with that
   Keywords Everywhere API key.
3. From the Dashboard, create a new OpenPageRank API key - that's the key
   this script actually uses.
4. Install the one dependency:
     pip install requests
5. Set your OpenPageRank API key:
     export OPR_API_KEY="your-api-key"
   (or pass it with --api-key)

Free tier (at time of writing): 30,000 domains/month, 100 domains per
request, 60 requests/minute. Check the dashboard for current limits.

USAGE
-----
   python authority_checker.py example.com another-site.com
   python authority_checker.py --file domains.txt
   python authority_checker.py example.com --csv results.csv
"""

import argparse
import csv
import os
import sys
import time

import requests

API_BASE = "https://openpagerank.keywordseverywhere.com"
BULK_ENDPOINT = f"{API_BASE}/v1/domains/bulk"
BATCH_SIZE = 100  # max domains per request
FIELDS = ["domain", "open_page_rank", "global_rank", "referring_domains"]
HEADERS_DISPLAY = ["Domain", "Open PageRank (0-10)", "Global Rank", "Referring Domains"]


def get_api_key(args):
    api_key = args.api_key or os.environ.get("OPR_API_KEY")
    if not api_key:
        sys.exit(
            "Missing OpenPageRank API key.\n"
            "Set OPR_API_KEY as an environment variable, or pass --api-key.\n"
            "Get one (free) at https://openpagerank.keywordseverywhere.com:\n"
            "  1. Sign in with a free Keywords Everywhere account\n"
            "  2. Create an OpenPageRank API key from the Dashboard"
        )
    return api_key


def strip_scheme(domain: str) -> str:
    d = domain.strip()
    d = d.replace("https://", "").replace("http://", "")
    d = d.split("/")[0]
    return d


def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def fetch_scores(domains, api_key):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    results = []

    for batch in chunked(domains, BATCH_SIZE):
        resp = requests.post(
            BULK_ENDPOINT,
            headers=headers,
            json={"domains": batch, "include_history": False},
            timeout=30,
        )

        if resp.status_code in (401, 403):
            sys.exit("Authentication failed — check your OPR_API_KEY / --api-key.")
        if resp.status_code == 429:
            sys.exit("Rate limit exceeded — slow down or wait a bit before retrying.")
        resp.raise_for_status()

        data = resp.json()
        for item in data.get("results", []):
            found = item.get("found", True)
            results.append({
                "domain": item.get("domain", "-"),
                "open_page_rank": item.get("open_page_rank", "-") if found else "not found",
                "global_rank": item.get("rank", "unranked") if found else "-",
                "referring_domains": item.get("referring_domains", "-") if found else "-",
            })
        for bad in data.get("invalid", []):
            results.append({
                "domain": bad, "open_page_rank": "invalid domain",
                "global_rank": "-", "referring_domains": "-",
            })

        if len(domains) > BATCH_SIZE:
            time.sleep(0.5)

    return results


def print_table(rows):
    widths = []
    for header, key in zip(HEADERS_DISPLAY, FIELDS):
        w = len(header)
        for r in rows:
            w = max(w, len(str(r.get(key, "-"))))
        widths.append(w)

    def fmt(values):
        return " | ".join(str(v).ljust(w) for v, w in zip(values, widths))

    print(fmt(HEADERS_DISPLAY))
    print("-+-".join("-" * w for w in widths))
    for r in rows:
        print(fmt([r.get(k, "-") for k in FIELDS]))


def main():
    parser = argparse.ArgumentParser(
        description="Check a free Domain Authority-style score via OpenPageRank (Keywords Everywhere)"
    )
    parser.add_argument("domains", nargs="*", help="Domains to check (e.g. example.com)")
    parser.add_argument("--file", "-f", help="Text file with one domain per line")
    parser.add_argument("--csv", help="Also write results to this CSV file")
    parser.add_argument("--api-key", help="OpenPageRank API key (overrides OPR_API_KEY env var)")
    args = parser.parse_args()

    targets = list(args.domains)
    if args.file:
        with open(args.file) as f:
            targets += [line.strip() for line in f if line.strip()]

    if not targets:
        parser.error("Provide at least one domain (as an argument, or via --file).")

    targets = [strip_scheme(t) for t in targets]
    api_key = get_api_key(args)

    print(f"Checking {len(targets)} domain(s) via OpenPageRank...\n")
    rows = fetch_scores(targets, api_key)
    print_table(rows)
    print(
        "\nNote: this is OpenPageRank's independent authority score (0-10), "
        "not Moz's DA/PA/Spam Score."
    )

    if args.csv:
        with open(args.csv, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(rows)
        print(f"Saved results to {args.csv}")


if __name__ == "__main__":
    main()
