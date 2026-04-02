# Content Channel System

## Purpose

This document is the source of truth for how the same underlying project or topic should be expressed differently across:

- site
- GitHub
- LinkedIn
- X

Use it as an anti-hallucination guide whenever AI helps create or refine content.

## Core Rule

The three channels are integrated, but they are not duplicates.

Each one has a different job:

- Site: explain the business problem, market context, and strategic value in executive-friendly language
- GitHub: show the operational implementation, code structure, architecture, setup, and technical proof
- LinkedIn: bridge the two by connecting business context with operational credibility in a concise public format
- X: create fast-moving visibility by turning one market signal and one execution proof into a short post or compact thread

## Channel Roles

### Site
- Primary function: public showcase and authority building
- Tone: professional, business-oriented, strategic, accessible
- Focus:
  - why the problem matters
  - who is affected
  - what the business pressure is
  - what kind of solution pattern addresses it
  - what the next logical step is for the reader
- Avoid:
  - excessive low-level implementation detail
  - sounding like internal engineering documentation
  - exposing the automation pipeline as a public feature

### GitHub
- Primary function: operational proof
- Tone: technical, direct, implementation-oriented
- Focus:
  - architecture
  - stack
  - setup and run instructions
  - code organization
  - production next steps
- Avoid:
  - generic business marketing language
  - vague claims without technical evidence

### LinkedIn
- Primary function: distribution and synthesis
- Tone: concise, credible, high-signal
- Focus:
  - one business pressure
  - one technical response
  - one proof point
  - one call to action or reflection
- Avoid:
  - copying the website paragraph
  - copying the README intro
  - sounding too promotional or too abstract

### X
- Primary function: reach and repetition
- Tone: direct, opinionated, credible, compact
- Focus:
  - one business pressure
  - one operational proof
  - one tight call to action
- Avoid:
  - generic engagement bait
  - long corporate phrasing
  - copying the LinkedIn post verbatim

## Canonical Flow

1. Start from the real project or topic.
2. Define the business problem first.
3. Define the operational implementation second.
4. Create site copy from business framing.
5. Create GitHub copy from implementation framing.
6. Create LinkedIn copy as the bridge between the two.
7. Create X copy as the fast-moving public signal.

## AI Authoring Rules

When AI helps create a new project or article, it should always produce:

- `site angle`
- `github angle`
- `linkedin angle`
- `x angle`

And it should keep them distinct:

- Site asks: why should a business stakeholder care?
- GitHub asks: how does this actually work?
- LinkedIn asks: how do I connect value and execution in one short post?
- X asks: what is the sharpest version of this insight that still points back to site and GitHub proof?

## Example Mapping

### Example: CDC Pipeline
- Site: reduce delay between operational change and analytical visibility
- GitHub: Debezium, Kafka, Python consumer, dbt layering
- LinkedIn: why fresher operational data matters and how CDC enables it
- X: one-line market pressure plus a short thread that points to the repo and article

### Example: Lakehouse Platform
- Site: modernization, governance, reuse, scalability
- GitHub: Terraform, S3, Databricks, PySpark, Delta Lake
- LinkedIn: connect platform modernization pressure to lakehouse delivery pattern

## Public Positioning Guardrail

The site should feel like a serious publication or business-facing portfolio, not like a demo of the automation behind it.

The orchestration layer stays behind the scenes.

## Retention Guardrail

Every important content surface should make continuation obvious.

That can happen through:

- related proof
- related market context
- newsletter subscription
- a repeat-worthy asset like the Tech Radar

But it should not happen through:

- generic "read more" loops with no context
- multiple competing CTAs with no priority
- conversion blocks that interrupt the narrative too early

## Proof Density Rule

High-value projects and articles should not stop at good framing.

They should include at least three of the following:

- one concrete architecture path
- one explicit tradeoff
- one operational artifact or file path
- one visible business effect
- one production next step
- one reason the reader should care now

Use `docs/HIGH_VALUE_CONTENT_BRIEFS.md` as the working checklist for priority rewrites.
