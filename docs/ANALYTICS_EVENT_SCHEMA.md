# Analytics Event Schema

## Goal

Track enough behavior to answer:

- what brings people in
- what makes them continue
- what makes them subscribe
- what content paths lead to contact or resume intent

## Event Catalog

### `content_view`
- Fires on route change
- Parameters:
  - `page`
  - `locale`
  - `page_type`
  - `section`

### `surface_view`
- Fires when a tracked growth or retention surface enters the viewport
- Parameters:
  - `location`
  - `surface_type`
  - `locale`
  - `page_type`
  - `source_type`
  - `source_slug`
  - `candidate_count`

### `scroll_depth`
- Fires at `25`, `50`, `75`, `100`
- Parameters:
  - `depth`
  - `page`
  - `locale`
  - `page_type`

### `navigation_click`
- Fires on important internal navigation actions
- Parameters:
  - `location`
  - `target`
  - `locale`
- New growth surfaces using this event:
  - `home_entry_paths`
  - `home_hero`
  - `home_signals`
  - `home_radar`

### `locale_switch`
- Fires when switching site language
- Parameters:
  - `from_locale`
  - `to_locale`
  - `page`

### `content_card_click`
- Fires on article/project/news cards
- Parameters:
  - `content_type`
  - `slug`
  - `location`
  - `locale`

### `related_content_click`
- Fires on recirculation links and next-step panels
- Parameters:
  - `source_type`
  - `source_slug`
  - `target_type`
  - `target_slug`
  - `locale`
  - `location`
- New retention surfaces using this event:
  - `article_journey`
  - `news_journey`
  - `project_journey`
  - `article_topic_cluster`
  - `news_topic_cluster`
  - `project_topic_cluster`
  - `retention_panel`

### `external_link_click`
- Fires on non-contact external destinations
- Parameters:
  - `channel`
  - `location`
  - `slug`

### `contact_click`
- Fires on email/LinkedIn contact actions
- Parameters:
  - `channel`
  - `location`

### `newsletter_submit_started`
- Parameters:
  - `locale`
  - `source`

### `newsletter_signup`
- Parameters:
  - `locale`
  - `source`

### `newsletter_signup_error`
- Parameters:
  - `locale`
  - `source`

### `news_filter_change`
- Parameters:
  - `locale`
  - `category`

### `news_pagination_click`
- Parameters:
  - `locale`
  - `page`
  - `category`

### `radar_filter_change`
- Parameters:
  - `locale`
  - `filter_type`
  - `value`

### `radar_entry_expand`
- Parameters:
  - `locale`
  - `entry_name`
  - `state`

### `resume_download`
- Parameters:
  - `locale`
  - `file`

### `share_click`
- Fires when a visitor uses detail-page share actions (LinkedIn, X, or copy link)
- Parameters:
  - `channel` (`linkedin` | `x` | `copy`)
  - `locale`
  - `content_type` (`article` | `project` | `news`)
  - `slug`
  - `location` (`detail_share`)

## Funnel Views To Build

### Retention Funnel
- `content_view`
- `surface_view`
- `scroll_depth >= 75`
- `related_content_click`
- `newsletter_signup`

### Authority Funnel
- `content_view`
- `content_card_click`
- `external_link_click` on GitHub
- `contact_click` or `resume_download`

### Repeat-Worthy Asset Funnel
- `content_view` on `radar`
- `radar_entry_expand`
- `newsletter_signup` from `radar-page`

## Documentation Rule

When new interactive surfaces are added, their event names and parameters must be documented here in the same change set.
