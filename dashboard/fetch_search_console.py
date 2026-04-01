"""Fetch Google Search Console metrics and save to local CSV for dashboard consumption.

Requires a Google Cloud service account with Search Console API access.
Set GOOGLE_APPLICATION_CREDENTIALS to the service account JSON key path.
Set GSC_SITE_URL to the Search Console property (e.g., 'sc-domain:michael.business').
"""

import json
import os
import sys
from datetime import date, datetime, timedelta

import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DAYS_BACK = 28


def get_search_console_service() -> "Resource":
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        print("ERROR: google-api-python-client and google-auth are required")
        print("  pip install google-api-python-client google-auth")
        sys.exit(1)

    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not credentials_path:
        print("ERROR: GOOGLE_APPLICATION_CREDENTIALS must be set")
        sys.exit(1)

    credentials = service_account.Credentials.from_service_account_file(
        credentials_path,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    return build("searchconsole", "v1", credentials=credentials)


def fetch_performance_data(
    service: "Resource",
    site_url: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    """Fetch search performance grouped by date, query, and page."""
    body = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": ["date", "query", "page"],
        "rowLimit": 5000,
    }

    response = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    rows = response.get("rows", [])

    results = []
    for row in rows:
        keys = row.get("keys", [])
        results.append({
            "date": keys[0] if len(keys) > 0 else None,
            "query": keys[1] if len(keys) > 1 else None,
            "page": keys[2] if len(keys) > 2 else None,
            "clicks": row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr": row.get("ctr", 0),
            "position": row.get("position", 0),
        })

    return results


def fetch_daily_summary(
    service: "Resource",
    site_url: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    """Fetch daily aggregated search performance."""
    body = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": ["date"],
        "rowLimit": 500,
    }

    response = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    rows = response.get("rows", [])

    return [
        {
            "date": row["keys"][0],
            "clicks": row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr": row.get("ctr", 0),
            "position": row.get("position", 0),
        }
        for row in rows
    ]


def main() -> None:
    site_url = os.environ.get("GSC_SITE_URL", "sc-domain:michael.business")
    end_date = date.today() - timedelta(days=3)  # GSC data has ~3 day lag
    start_date = end_date - timedelta(days=DAYS_BACK)

    print(f"Fetching Search Console data for {site_url}")
    print(f"  Period: {start_date} to {end_date}")

    service = get_search_console_service()

    os.makedirs(DATA_DIR, exist_ok=True)

    print("Fetching daily summary...")
    daily_data = fetch_daily_summary(service, site_url, start_date, end_date)
    daily_df = pd.DataFrame(daily_data)
    daily_path = os.path.join(DATA_DIR, "gsc_daily.csv")
    daily_df.to_csv(daily_path, index=False)
    print(f"  Saved {len(daily_df)} days to {daily_path}")

    print("Fetching detailed performance data...")
    detail_data = fetch_performance_data(service, site_url, start_date, end_date)
    detail_df = pd.DataFrame(detail_data)
    detail_path = os.path.join(DATA_DIR, "gsc_detail.csv")
    detail_df.to_csv(detail_path, index=False)
    print(f"  Saved {len(detail_df)} rows to {detail_path}")

    if not daily_df.empty:
        total_clicks = daily_df["clicks"].sum()
        total_impressions = daily_df["impressions"].sum()
        avg_ctr = total_clicks / total_impressions * 100 if total_impressions > 0 else 0
        avg_position = daily_df["position"].mean()
        print(f"\n  Summary ({DAYS_BACK}d):")
        print(f"    Clicks: {total_clicks}")
        print(f"    Impressions: {total_impressions}")
        print(f"    CTR: {avg_ctr:.2f}%")
        print(f"    Avg Position: {avg_position:.1f}")

    metadata = {
        "fetched_at": datetime.utcnow().isoformat(),
        "site_url": site_url,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily_rows": len(daily_df),
        "detail_rows": len(detail_df),
    }
    metadata_path = os.path.join(DATA_DIR, "gsc_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nDone. Data saved to {DATA_DIR}/")


if __name__ == "__main__":
    main()
