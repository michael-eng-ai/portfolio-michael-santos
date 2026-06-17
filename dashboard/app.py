"""Portfolio analytics dashboard consolidating content pipeline, social, and SEO metrics."""

import hashlib
import hmac
import json
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


@st.cache_data(ttl=300)
def load_analytics_events(days: int = 90) -> pd.DataFrame:
    conn = get_db_connection()
    query = f"""
        SELECT
            event_name,
            occurred_at,
            page,
            locale,
            page_type,
            source_type,
            source_slug,
            target_type,
            target_slug,
            location,
            depth,
            metadata::text AS metadata_json,
            session_id
        FROM public.analytics_events
        WHERE occurred_at >= now() - interval '{int(days)} days'
        ORDER BY occurred_at DESC
    """

    try:
        df = pd.read_sql(query, conn)
    except Exception:
        return pd.DataFrame()

    if df.empty:
        return df

    df["occurred_at"] = pd.to_datetime(df["occurred_at"], utc=True, errors="coerce")

    def parse_metadata(value: object) -> dict:
        if isinstance(value, dict):
            return value
        if isinstance(value, str) and value.strip():
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return {}
        return {}

    df["metadata"] = df["metadata_json"].apply(parse_metadata)
    df["source"] = df["metadata"].apply(lambda payload: payload.get("source"))
    df["channel"] = df["metadata"].apply(lambda payload: payload.get("channel"))
    df["file"] = df["metadata"].apply(lambda payload: payload.get("file"))
    df["category"] = df["metadata"].apply(lambda payload: payload.get("category"))
    df["content_type"] = df["metadata"].apply(lambda payload: payload.get("content_type"))
    df["target"] = df["metadata"].apply(lambda payload: payload.get("target"))
    df["surface_type"] = df["metadata"].apply(lambda payload: payload.get("surface_type"))
    df["page"] = df["page"].fillna("/unknown")
    df["page_type"] = df["page_type"].fillna("unknown")
    df["locale"] = df["locale"].fillna("unknown")

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


def get_recent_events(events_df: pd.DataFrame, days: int = 30) -> pd.DataFrame:
    if events_df.empty:
        return pd.DataFrame()

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return events_df[events_df["occurred_at"] >= cutoff].copy()


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


def render_engagement_kpis(events_df: pd.DataFrame) -> None:
    st.subheader("On-Site Engagement")

    if events_df.empty:
        st.info(
            "No internal analytics events found yet. Apply the analytics schema "
            "(`analytics_events.sql`, bootstrapped by `ops/gcp/worker/postgres/`) "
            "and browse the site to start collecting engagement data."
        )
        return

    now = datetime.now(timezone.utc)
    recent = events_df[events_df["occurred_at"] >= now - timedelta(days=30)].copy()

    if recent.empty:
        st.info("Internal analytics table exists, but there are no events in the last 30 days.")
        return

    content_views = recent[recent["event_name"] == "content_view"]
    deep_reads = recent[
        (recent["event_name"] == "scroll_depth") & (recent["depth"].fillna(0) >= 75)
    ]
    related_clicks = recent[recent["event_name"] == "related_content_click"]
    newsletter_signups = recent[recent["event_name"] == "newsletter_signup"]
    high_intent = recent[recent["event_name"].isin(["contact_click", "resume_download"])]

    cols = st.columns(5)
    cols[0].metric("Views (30d)", int(len(content_views)))
    cols[1].metric("Sessions", int(content_views["session_id"].nunique()))
    cols[2].metric(
        "Deep Reads",
        int(deep_reads["session_id"].nunique()),
        (
            f"{deep_reads['session_id'].nunique() / content_views['session_id'].nunique() * 100:.0f}% session rate"
            if content_views["session_id"].nunique() > 0
            else "0%"
        ),
    )
    cols[3].metric("Related Clicks", int(len(related_clicks)))
    cols[4].metric("Signups + Intent", int(len(newsletter_signups) + len(high_intent)))


def render_engagement_funnel(events_df: pd.DataFrame) -> None:
    st.subheader("Engagement Funnel (30d)")

    if events_df.empty:
        return

    now = datetime.now(timezone.utc)
    recent = events_df[events_df["occurred_at"] >= now - timedelta(days=30)].copy()

    if recent.empty:
        return

    stages = [
        (
            "Viewed Content",
            recent[recent["event_name"] == "content_view"]["session_id"].nunique(),
        ),
        (
            "Deep Read (75%+)",
            recent[
                (recent["event_name"] == "scroll_depth") & (recent["depth"].fillna(0) >= 75)
            ]["session_id"].nunique(),
        ),
        (
            "Clicked Related",
            recent[recent["event_name"] == "related_content_click"]["session_id"].nunique(),
        ),
        (
            "Newsletter Signup",
            recent[recent["event_name"] == "newsletter_signup"]["session_id"].nunique(),
        ),
        (
            "High Intent",
            recent[recent["event_name"].isin(["contact_click", "resume_download"])]["session_id"].nunique(),
        ),
    ]

    funnel = pd.DataFrame(stages, columns=["stage", "sessions"])

    fig = go.Figure(
        go.Funnel(
            y=funnel["stage"],
            x=funnel["sessions"],
            textinfo="value+percent initial",
        )
    )
    fig.update_layout(height=340, margin=dict(t=10, b=10))
    st.plotly_chart(fig, use_container_width=True)


def render_top_content_paths(events_df: pd.DataFrame) -> None:
    st.subheader("Top Content Paths")

    if events_df.empty:
        return

    views = (
        events_df[events_df["event_name"] == "content_view"]
        .groupby(["page", "page_type", "locale"], as_index=False)
        .agg(page_views=("event_name", "size"), sessions=("session_id", "nunique"))
    )

    if views.empty:
        st.info("No content view events available yet.")
        return

    deep_reads = (
        events_df[
            (events_df["event_name"] == "scroll_depth")
            & (events_df["depth"].fillna(0) >= 75)
        ]
        .groupby("page", as_index=False)
        .agg(deep_read_sessions=("session_id", "nunique"))
    )
    related_clicks = (
        events_df[events_df["event_name"] == "related_content_click"]
        .groupby("page", as_index=False)
        .agg(related_clicks=("event_name", "size"))
    )

    merged = views.merge(deep_reads, on="page", how="left").merge(related_clicks, on="page", how="left")
    merged["deep_read_sessions"] = merged["deep_read_sessions"].fillna(0).astype(int)
    merged["related_clicks"] = merged["related_clicks"].fillna(0).astype(int)
    merged["deep_read_rate"] = (
        merged["deep_read_sessions"] / merged["sessions"].replace({0: pd.NA}) * 100
    ).fillna(0).round(1)
    merged["related_click_rate"] = (
        merged["related_clicks"] / merged["page_views"].replace({0: pd.NA}) * 100
    ).fillna(0).round(1)

    st.dataframe(
        merged.sort_values(["sessions", "page_views"], ascending=False).head(15),
        use_container_width=True,
        hide_index=True,
    )


def render_conversion_sources(events_df: pd.DataFrame) -> None:
    st.subheader("Newsletter Sources And Locale Mix")

    if events_df.empty:
        return

    signups = events_df[events_df["event_name"] == "newsletter_signup"].copy()

    if signups.empty:
        st.info("No newsletter signup events recorded yet.")
        return

    signups["source"] = signups["source"].fillna("unknown")
    summary = (
        signups.groupby(["source", "locale"], as_index=False)
        .agg(signups=("event_name", "size"))
        .sort_values("signups", ascending=False)
    )

    fig = px.bar(
        summary,
        x="source",
        y="signups",
        color="locale",
        barmode="group",
        labels={"source": "Signup Source", "signups": "Signups", "locale": "Locale"},
    )
    fig.update_layout(height=320, margin=dict(t=10, b=10))
    st.plotly_chart(fig, use_container_width=True)

    st.dataframe(summary, use_container_width=True, hide_index=True)


def render_page_type_mix(events_df: pd.DataFrame) -> None:
    st.subheader("Views By Page Type")

    if events_df.empty:
        return

    views = events_df[events_df["event_name"] == "content_view"].copy()

    if views.empty:
        return

    summary = (
        views.groupby(["page_type", "locale"], as_index=False)
        .agg(views=("event_name", "size"), sessions=("session_id", "nunique"))
        .sort_values("views", ascending=False)
    )

    fig = px.bar(
        summary,
        x="page_type",
        y="views",
        color="locale",
        barmode="stack",
        labels={"page_type": "Page Type", "views": "Views", "locale": "Locale"},
    )
    fig.update_layout(height=320, margin=dict(t=10, b=10))
    st.plotly_chart(fig, use_container_width=True)


def render_home_entry_paths_performance(events_df: pd.DataFrame) -> None:
    st.subheader("Home Entry Paths")

    recent = get_recent_events(events_df, 30)
    if recent.empty:
        st.info("No internal analytics events available for entry-path analysis yet.")
        return

    impressions = recent[
        (recent["event_name"] == "surface_view") & (recent["location"] == "home_entry_paths")
    ].copy()
    clicks = recent[
        (recent["event_name"] == "navigation_click") & (recent["location"] == "home_entry_paths")
    ].copy()

    if impressions.empty:
        st.info("No `home_entry_paths` impressions recorded yet.")
        return

    total_impression_sessions = int(impressions["session_id"].nunique())
    total_click_sessions = int(clicks["session_id"].nunique())
    session_ctr = (
        total_click_sessions / total_impression_sessions * 100
        if total_impression_sessions > 0
        else 0
    )
    top_target = (
        clicks["target"].fillna("unknown").value_counts().idxmax()
        if not clicks.empty
        else "-"
    )

    cols = st.columns(4)
    cols[0].metric("Surface Sessions", total_impression_sessions)
    cols[1].metric("Click Sessions", total_click_sessions, f"{session_ctr:.1f}% CTR")
    cols[2].metric("Total Clicks", int(len(clicks)))
    cols[3].metric("Top Entry Target", str(top_target).replace("_", " ").title())

    locale_impressions = (
        impressions.groupby("locale", as_index=False)
        .agg(impression_sessions=("session_id", "nunique"))
    )
    summary = (
        clicks.assign(target=clicks["target"].fillna("unknown"))
        .groupby(["target", "locale"], as_index=False)
        .agg(clicks=("event_name", "size"), click_sessions=("session_id", "nunique"))
    )

    if summary.empty:
        st.info("The entry-path surface is visible, but no clicks have been recorded yet.")
        return

    summary = summary.merge(locale_impressions, on="locale", how="left")
    summary["impression_sessions"] = summary["impression_sessions"].fillna(0).astype(int)
    summary["session_ctr"] = (
        summary["click_sessions"] / summary["impression_sessions"].replace({0: pd.NA}) * 100
    ).fillna(0).round(1)
    summary["target_label"] = summary["target"].str.replace("_", " ").str.title()

    fig = px.bar(
        summary.sort_values(["click_sessions", "clicks"], ascending=False),
        x="target_label",
        y="click_sessions",
        color="locale",
        barmode="group",
        text="session_ctr",
        labels={
            "target_label": "Entry Target",
            "click_sessions": "Sessions With Click",
            "locale": "Locale",
            "session_ctr": "Session CTR",
        },
    )
    fig.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
    fig.update_layout(height=320, margin=dict(t=10, b=10), yaxis_title="Sessions")
    st.plotly_chart(fig, use_container_width=True)

    st.dataframe(
        summary[["target_label", "locale", "impression_sessions", "click_sessions", "clicks", "session_ctr"]]
        .sort_values(["click_sessions", "clicks"], ascending=False),
        use_container_width=True,
        hide_index=True,
    )


def render_retention_surface_performance(events_df: pd.DataFrame) -> None:
    st.subheader("Retention Surface Performance")

    recent = get_recent_events(events_df, 30)
    if recent.empty:
        return

    tracked_locations = [
        "article_journey",
        "news_journey",
        "project_journey",
        "article_topic_cluster",
        "news_topic_cluster",
        "project_topic_cluster",
        "retention_panel",
    ]
    surface_labels = {
        "article_journey": "Article Journey",
        "news_journey": "News Journey",
        "project_journey": "Project Journey",
        "article_topic_cluster": "Article Topic Cluster",
        "news_topic_cluster": "News Topic Cluster",
        "project_topic_cluster": "Project Topic Cluster",
        "article_retention_panel": "Article End Panel",
        "news_retention_panel": "News End Panel",
        "project_retention_panel": "Project End Panel",
    }

    impressions = recent[
        (recent["event_name"] == "surface_view") & (recent["location"].isin(tracked_locations))
    ].copy()
    clicks = recent[
        (recent["event_name"] == "related_content_click") & (recent["location"].isin(tracked_locations))
    ].copy()

    if impressions.empty:
        st.info("No journey, topic-cluster, or retention-panel impressions recorded yet.")
        return

    def resolve_surface_key(frame: pd.DataFrame) -> pd.Series:
        source_type = frame["source_type"].fillna("unknown")
        return frame["location"].where(
            frame["location"] != "retention_panel",
            source_type + "_retention_panel",
        )

    impressions["surface_key"] = resolve_surface_key(impressions)
    clicks["surface_key"] = resolve_surface_key(clicks)

    summary = (
        impressions.groupby("surface_key", as_index=False)
        .agg(impressions=("event_name", "size"), impression_sessions=("session_id", "nunique"))
    )
    click_summary = (
        clicks.groupby("surface_key", as_index=False)
        .agg(clicks=("event_name", "size"), click_sessions=("session_id", "nunique"))
    )

    summary = summary.merge(click_summary, on="surface_key", how="left")
    summary[["clicks", "click_sessions"]] = summary[["clicks", "click_sessions"]].fillna(0).astype(int)
    summary["session_ctr"] = (
        summary["click_sessions"] / summary["impression_sessions"].replace({0: pd.NA}) * 100
    ).fillna(0).round(1)
    summary["surface"] = summary["surface_key"].map(surface_labels).fillna(summary["surface_key"])

    best_surface = (
        summary.sort_values(["session_ctr", "click_sessions"], ascending=False)["surface"].iloc[0]
        if not summary.empty
        else "-"
    )
    total_surface_sessions = int(summary["impression_sessions"].sum())
    total_click_sessions = int(summary["click_sessions"].sum())

    cols = st.columns(4)
    cols[0].metric("Surface Sessions", total_surface_sessions)
    cols[1].metric(
        "Click Sessions",
        total_click_sessions,
        (
            f"{total_click_sessions / total_surface_sessions * 100:.1f}% CTR"
            if total_surface_sessions > 0
            else "0%"
        ),
    )
    cols[2].metric("Total Surface Clicks", int(summary["clicks"].sum()))
    cols[3].metric("Best Surface", best_surface)

    fig = px.bar(
        summary.sort_values("session_ctr", ascending=False),
        x="surface",
        y="session_ctr",
        text="session_ctr",
        labels={"surface": "Surface", "session_ctr": "Session CTR (%)"},
    )
    fig.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
    fig.update_layout(height=320, margin=dict(t=10, b=10), yaxis_title="CTR (%)")
    st.plotly_chart(fig, use_container_width=True)

    if not clicks.empty:
        target_mix = (
            clicks.assign(
                surface=clicks["surface_key"].map(surface_labels).fillna(clicks["surface_key"]),
                target_type=clicks["target_type"].fillna("unknown"),
            )
            .groupby(["surface", "target_type"], as_index=False)
            .agg(clicks=("event_name", "size"))
        )

        mix_fig = px.bar(
            target_mix,
            x="surface",
            y="clicks",
            color="target_type",
            barmode="stack",
            labels={"surface": "Surface", "clicks": "Clicks", "target_type": "Target Type"},
        )
        mix_fig.update_layout(height=320, margin=dict(t=10, b=10))
        st.plotly_chart(mix_fig, use_container_width=True)

    st.dataframe(
        summary[["surface", "impression_sessions", "click_sessions", "clicks", "session_ctr"]]
        .sort_values(["session_ctr", "click_sessions"], ascending=False),
        use_container_width=True,
        hide_index=True,
    )


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
    events_df = load_analytics_events()

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
    render_engagement_kpis(events_df)
    col_left, col_right = st.columns([2, 3])
    with col_left:
        render_engagement_funnel(events_df)
        render_page_type_mix(events_df)
    with col_right:
        render_top_content_paths(events_df)

    st.divider()
    col_left, col_right = st.columns(2)
    with col_left:
        render_home_entry_paths_performance(events_df)
    with col_right:
        render_retention_surface_performance(events_df)

    st.divider()
    render_conversion_sources(events_df)

    st.divider()
    render_search_console_section()

    st.divider()
    with st.expander("Raw Data"):
        st.dataframe(
            df[["slug", "published_at", "source_name", "is_active", "is_enriched", "x_post_status", "linkedin_post_status"]],
            use_container_width=True,
        )

    if not events_df.empty:
        with st.expander("Raw Analytics Events"):
            st.dataframe(
                events_df[
                    [
                        "occurred_at",
                        "event_name",
                        "page",
                        "locale",
                        "page_type",
                        "location",
                        "surface_type",
                        "source",
                        "channel",
                        "session_id",
                    ]
                ],
                use_container_width=True,
                hide_index=True,
            )

    st.caption(f"Last refreshed: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")


if __name__ == "__main__":
    main()
