# Content Channel System

## Purpose

This document is the source of truth for how the same underlying project or topic should be expressed differently across:

- site
- GitHub
- LinkedIn

Use it as an anti-hallucination guide whenever AI helps create or refine content.

## Core Rule

The three channels are integrated, but they are not duplicates.

Each one has a different job:

- Site: explain the business problem, market context, and strategic value in executive-friendly language
- GitHub: show the operational implementation, code structure, architecture, setup, and technical proof
- LinkedIn: bridge the two by connecting business context with operational credibility in a concise public format

## Channel Roles

### Site
- Primary function: public showcase and authority building
- Tone: professional, business-oriented, strategic, accessible
- Focus:
  - why the problem matters
  - who is affected
  - what the business pressure is
  - what kind of solution pattern addresses it
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

## Canonical Flow

1. Start from the real project or topic.
2. Define the business problem first.
3. Define the operational implementation second.
4. Create site copy from business framing.
5. Create GitHub copy from implementation framing.
6. Create LinkedIn copy as the bridge between the two.

## AI Authoring Rules

When AI helps create a new project or article, it should always produce:

- `site angle`
- `github angle`
- `linkedin angle`

And it should keep them distinct:

- Site asks: why should a business stakeholder care?
- GitHub asks: how does this actually work?
- LinkedIn asks: how do I connect value and execution in one short post?

## Example Mapping

### Example: CDC Pipeline
- Site: reduce delay between operational change and analytical visibility
- GitHub: Debezium, Kafka, Python consumer, dbt layering
- LinkedIn: why fresher operational data matters and how CDC enables it

### Example: Lakehouse Platform
- Site: modernization, governance, reuse, scalability
- GitHub: Terraform, S3, Databricks, PySpark, Delta Lake
- LinkedIn: connect platform modernization pressure to lakehouse delivery pattern

## Public Positioning Guardrail

The site should feel like a serious publication or business-facing portfolio, not like a demo of the automation behind it.

The orchestration layer stays behind the scenes.
