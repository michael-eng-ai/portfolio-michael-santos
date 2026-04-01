"""Portfolio analytics dashboard consolidating content pipeline, social, and SEO metrics."""

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="Portfolio Analytics",
    page_icon="M",
    layout="wide",
)


def check_password() -> bool:
    """Gate access with a password. Returns True if authenticated."""
    password_hash = os.environ.get("DASHBOARD_PASSWORD_HASH", "")

    if not password_hash:
        st.error("DASHBOARD_PASSWORD_HASH not configured. Access denied.")
        st.stop()

    if st.session_state.get("authenticated"):
        return True

    st.markdown("### Portfolio Analytics")
    st.markdown("Enter your password to access the dashboard.")

    with st.form("login_form"):
        password_input = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")

    if submitted:
        input_hash = hashlib.sha256(password_input.encode()).hexdigest()
        if hmac.compare_digest(input_hash, password_hash):
            st.session_state["authenticated"] = True
            st.rerun()
        else:
            st.error("Incorrect password.")

    return False


@st.cache_resource
def get_db_connection() -> "psycopg2.extensions.connection":
    import psycopg2

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        st.error("DATABASE_URL not set")
        st.stop()
    return psycopg2.connect(database_url)


@st.cache_data(ttl=300)
def load_news_data() -> pd.DataFrame:
    conn = get_db_connection()
    query = """
        SELECT
            slug,
            published_at,
            source_name,
            is_active,
            editorial_analysis IS NOT NULL AS is_enriched,
            posted_to_x_at,
            posted_to_linkedin_at,
            x_post_status,
            linkedin_post_status,
            x_attempt_count,
            linkedin_attempt_count,
            x_external_post_id,
            linkedin_external_post_id,
            tags,
            created_at,
            updated_at
        FROM public.news
        ORDER BY published_at DESC
    """
    df = pd.read_sql(query, conn)
    for col in ["published_at", "posted_to_x_at", "posted_to_linkedin_at", "created_at", "updated_at"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], utc=True, errors="coerce")
    return df


@st.cache_data(ttl=600)
def load_github_stats() -> dict | None:
    token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPO", "michael-eng-ai/portfolio-michael-santos")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        repo_resp = requests.get(f"https://api.github.com/repos/{repo}", headers=headers, timeout=10)
        if repo_resp.status_code != 200:
            return None
        repo_data = repo_resp.json()

        commits_resp = requests.get(
            f"https://api.github.com/repos/{repo}/commits",
            headers=headers,
            params={"per_page": 30},
            timeout=10,
        )
        commits = commits_resp.json() if commits_resp.status_code == 200 else []

        return {
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "open_issues": repo_data.get("open_issues_count", 0),
            "watchers": repo_data.get("watchers_count", 0),
            "recent_commits": len(commits),
            "last_push": repo_data.get("pushed_at"),
        }
    except requests.RequestException:
        return None


def render_kpi_row(df: pd.DataFrame) -> None:
    now = datetime.now(timezone.utc)
    last_7d = now - timedelta(days=7)
    last_30d = now - timedelta(days=30)

    total_news = len(df)
    active_news = df["is_active"].sum()
    enriched = df["is_enriched"].sum()
    posted_x = df["posted_to_x_at"].notna().sum()
    posted_li = df["posted_to_linkedin_at"].notna().sum()

    recent_7d = df[df["published_at"] >= last_7d] if "published_at" in df.columns else pd.DataFrame()
    recent_30d = df[df["published_at"] >= last_30d] if "published_at" in df.columns else pd.DataFrame()

    cols = st.columns(6)
    cols[0].metric("Total News", total_news, f"+{len(recent_7d)} last 7d")
    cols[1].metric("Active", int(active_news))
    cols[2].metric("Enriched", int(enriched), f"{enriched/total_news*100:.0f}%" if total_news > 0 else "0%")
    cols[3].metric("Posted to X", int(posted_x))
    cols[4].metric("Posted to LinkedIn", int(posted_li))
    cols[5].metric("New (30d)", len(recent_30d))


def render_pipeline_chart(df: pd.DataFrame) -> None:
    st.subheader("Content Pipeline Funnel")

    total = len(df)
    active = int(df["is_active"].sum())
    enriched = int(df["is_enriched"].sum())
    posted_x = int(df["posted_to_x_at"].notna().sum())
    posted_li = int(df["posted_to_linkedin_at"].notna().sum())

    fig = go.Figure(go.Funnel(
        y=["Synced", "Active", "Enriched", "Posted X", "Posted LinkedIn"],
        x=[total, active, enriched, posted_x, posted_li],
        textinfo="value+percent initial",
    ))
    fig.update_layout(height=350, margin=dict(t=20, b=20))
    st.plotly_chart(fig, use_container_width=True)


def render_timeline_chart(df: pd.DataFrame) -> None:
    st.subheader("Publishing Timeline (last 30 days)")

    now = datetime.now(timezone.utc)
    last_30d = now - timedelta(days=30)
    recent = df[df["published_at"] >= last_30d].copy()

    if recent.empty:
        st.info("No news published in the last 30 days.")
        return

    recent["date"] = recent["published_at"].dt.date
    daily = recent.groupby("date").size().reset_index(name="count")
    daily["date"] = pd.to_datetime(daily["date"])

    fig = px.bar(daily, x="date", y="count", labels={"date": "Date", "count": "Articles"})
    fig.update_layout(height=300, margin=dict(t=20, b=20))
    st.plotly_chart(fig, use_container_width=True)


def render_social_delivery(df: pd.DataFrame) -> None:
    st.subheader("Social Delivery Status")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**X (Twitter)**")
        x_status = df["x_post_status"].value_counts().reset_index()
        x_status.columns = ["status", "count"]
        if not x_status.empty:
            fig = px.pie(x_status, values="count", names="status", hole=0.4)
            fig.update_layout(height=280, margin=dict(t=10, b=10))
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No X delivery data.")

    with col2:
        st.markdown("**LinkedIn**")
        li_status = df["linkedin_post_status"].value_counts().reset_index()
        li_status.columns = ["status", "count"]
        if not li_status.empty:
            fig = px.pie(li_status, values="count", names="status", hole=0.4)
            fig.update_layout(height=280, margin=dict(t=10, b=10))
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No LinkedIn delivery data.")

    dead_letter_x = df[df["x_post_status"] == "dead_letter"]
    dead_letter_li = df[df["linkedin_post_status"] == "dead_letter"]

    if not dead_letter_x.empty or not dead_letter_li.empty:
        st.warning(
            f"Dead letters: {len(dead_letter_x)} X, {len(dead_letter_li)} LinkedIn"
        )


def render_source_breakdown(df: pd.DataFrame) -> None:
    st.subheader("News Sources")
    sources = df["source_name"].value_counts().head(15).reset_index()
    sources.columns = ["source", "count"]

    fig = px.bar(sources, x="count", y="source", orientation="h", labels={"count": "Articles", "source": "Source"})
    fig.update_layout(height=400, margin=dict(t=20, b=20), yaxis=dict(autorange="reversed"))
    st.plotly_chart(fig, use_container_width=True)


def render_search_console_section() -> None:
    st.subheader("Search Console")

    data_dir = os.path.join(os.path.dirname(__file__), "data")
    daily_path = os.path.join(data_dir, "gsc_daily.csv")
    detail_path = os.path.join(data_dir, "gsc_detail.csv")
    metadata_path = os.path.join(data_dir, "gsc_metadata.json")

    has_auto_data = os.path.exists(daily_path)

    if has_auto_data:
        import json

        daily_df = pd.read_csv(daily_path)
        daily_df["date"] = pd.to_datetime(daily_df["date"])

        metadata = {}
        if os.path.exists(metadata_path):
            with open(metadata_path) as f:
                metadata = json.load(f)

        total_clicks = int(daily_df["clicks"].sum())
        total_impressions = int(daily_df["impressions"].sum())
        avg_ctr = total_clicks / total_impressions * 100 if total_impressions > 0 else 0
        avg_position = daily_df["position"].mean()

        cols = st.columns(4)
        cols[0].metric("Clicks", total_clicks)
        cols[1].metric("Impressions", total_impressions)
        cols[2].metric("CTR", f"{avg_ctr:.2f}%")
        cols[3].metric("Avg Position", f"{avg_position:.1f}")

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=daily_df["date"], y=daily_df["clicks"], name="Clicks", mode="lines+markers"))
        fig.add_trace(go.Scatter(x=daily_df["date"], y=daily_df["impressions"], name="Impressions", mode="lines", yaxis="y2"))
        fig.update_layout(
            height=300,
            margin=dict(t=20, b=20),
            yaxis=dict(title="Clicks"),
            yaxis2=dict(title="Impressions", overlaying="y", side="right"),
            legend=dict(orientation="h", yanchor="bottom", y=1.02),
        )
        st.plotly_chart(fig, use_container_width=True)

        if os.path.exists(detail_path):
            detail_df = pd.read_csv(detail_path)
            top_queries = detail_df.groupby("query").agg(
                clicks=("clicks", "sum"),
                impressions=("impressions", "sum"),
                avg_position=("position", "mean"),
            ).sort_values("clicks", ascending=False).head(20).reset_index()
            top_queries["ctr"] = (top_queries["clicks"] / top_queries["impressions"] * 100).round(2)
            top_queries["avg_position"] = top_queries["avg_position"].round(1)

            with st.expander("Top Queries"):
                st.dataframe(top_queries, use_container_width=True)

            top_pages = detail_df.groupby("page").agg(
                clicks=("clicks", "sum"),
                impressions=("impressions", "sum"),
                avg_position=("position", "mean"),
            ).sort_values("clicks", ascending=False).head(15).reset_index()
            top_pages["ctr"] = (top_pages["clicks"] / top_pages["impressions"] * 100).round(2)

            with st.expander("Top Pages"):
                st.dataframe(top_pages, use_container_width=True)

        if metadata.get("fetched_at"):
            st.caption(f"Data fetched: {metadata['fetched_at'][:19]} UTC")
        st.caption("Run `python dashboard/fetch_search_console.py` to refresh data.")
    else:
        st.info(
            "No automated Search Console data found. Run `python dashboard/fetch_search_console.py` "
            "or upload a CSV export below."
        )

    uploaded = st.file_uploader("Upload Search Console CSV (override)", type=["csv"])
    if uploaded is not None:
        gsc_df = pd.read_csv(uploaded)
        st.dataframe(gsc_df, use_container_width=True)

        click_col = next((c for c in gsc_df.columns if c.lower() in ("clicks", "click")), None)
        imp_col = next((c for c in gsc_df.columns if c.lower() in ("impressions", "impression")), None)

        if click_col and imp_col:
            col_a, col_b, col_c = st.columns(3)
            col_a.metric("Total Clicks", int(gsc_df[click_col].sum()))
            col_b.metric("Total Impressions", int(gsc_df[imp_col].sum()))
            avg_ctr = gsc_df[click_col].sum() / gsc_df[imp_col].sum() * 100 if gsc_df[imp_col].sum() > 0 else 0
            col_c.metric("Avg CTR", f"{avg_ctr:.1f}%")


def render_github_section(stats: dict | None) -> None:
    st.subheader("GitHub Repository")

    if stats is None:
        st.info("GitHub stats unavailable. Set GITHUB_TOKEN for authenticated access.")
        return

    cols = st.columns(5)
    cols[0].metric("Stars", stats["stars"])
    cols[1].metric("Forks", stats["forks"])
    cols[2].metric("Open Issues", stats["open_issues"])
    cols[3].metric("Watchers", stats["watchers"])
    cols[4].metric("Recent Commits", stats["recent_commits"])

    if stats.get("last_push"):
        last_push = datetime.fromisoformat(stats["last_push"].replace("Z", "+00:00"))
        st.caption(f"Last push: {last_push.strftime('%Y-%m-%d %H:%M UTC')}")


def main() -> None:
    if not check_password():
        return

    st.title("Portfolio Analytics Dashboard")
    st.caption("michael.business | Consolidated metrics")

    df = load_news_data()

    if df.empty:
        st.warning("No data found in the database.")
        return

    render_kpi_row(df)
    st.divider()

    col_left, col_right = st.columns([3, 2])

    with col_left:
        render_timeline_chart(df)
        render_pipeline_chart(df)

    with col_right:
        render_social_delivery(df)
        github_stats = load_github_stats()
        render_github_section(github_stats)

    st.divider()
    render_source_breakdown(df)

    st.divider()
    render_search_console_section()

    st.divider()
    with st.expander("Raw Data"):
        st.dataframe(
            df[["slug", "published_at", "source_name", "is_active", "is_enriched", "x_post_status", "linkedin_post_status"]],
            use_container_width=True,
        )

    st.caption(f"Last refreshed: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")


if __name__ == "__main__":
    main()
