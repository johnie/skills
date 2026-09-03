# Meeting Tagging Guide

Consistent tagging enables powerful filtering and organization of meeting notes.

## Tag Categories

### Meeting Type Tags

Use one primary type tag per meeting:

- `standup` - Daily/regular team sync-ups
- `planning` - Sprint planning, roadmap planning, goal setting
- `review` - Sprint reviews, design reviews, code reviews
- `retrospective` - Team retrospectives, post-mortems
- `one-on-one` - 1:1 meetings between manager and direct report
- `all-hands` - Company or department-wide meetings
- `workshop` - Collaborative working sessions, brainstorming
- `training` - Learning sessions, onboarding, knowledge sharing
- `interview` - Candidate interviews, hiring discussions
- `client` - External client meetings
- `demo` - Product demos, showcase sessions

### Topic/Domain Tags

Add multiple topic tags as relevant:

**Functional Areas:**

- `engineering` - Technical discussions, architecture, infrastructure
- `design` - UX/UI design, user research
- `product` - Product strategy, roadmap, features
- `marketing` - Marketing campaigns, content, positioning
- `sales` - Sales strategy, deals, pipeline
- `support` - Customer support, tickets, escalations
- `operations` - Business operations, processes

**Common Topics:**

- `strategy` - Strategic planning, vision, direction
- `hiring` - Recruitment, hiring plans, interviewing
- `budget` - Financial planning, budget allocation
- `performance` - Performance reviews, feedback
- `onboarding` - New hire onboarding
- `incident` - Incident response, postmortems
- `launch` - Product or feature launches
- `metrics` - KPIs, analytics, reporting
- `process` - Process improvements, workflows
- `security` - Security reviews, compliance
- `architecture` - System architecture, technical design

### Cadence Tags

Add cadence tags for recurring meetings:

- `daily` - Daily meetings
- `weekly` - Weekly recurring meetings
- `biweekly` - Every two weeks
- `monthly` - Monthly meetings
- `quarterly` - Quarterly business reviews, planning
- `annual` - Annual reviews, planning

## Tagging Examples

### Example 1: Sprint Planning

```yaml
tags:
  - planning
  - engineering
  - biweekly
```

### Example 2: Quarterly All-Hands

```yaml
tags:
  - all-hands
  - strategy
  - quarterly
```

### Example 3: Post-Incident Review

```yaml
tags:
  - retrospective
  - incident
  - engineering
  - security
```

## Tagging Best Practices

1. **Be consistent** - Use the same tags for similar meetings
2. **Keep lowercase** - All tags should be lowercase for consistency
3. **Use hyphens for multi-word tags** - e.g., `all-hands`, `one-on-one`

## Custom Tags

For organization-specific topics not covered above, create custom tags following these rules:

- Use lowercase
- Use hyphens for multi-word tags
- Be specific but not too narrow (avoid one-off tags)
- Document new tags if they'll be reused

Examples of good custom tags:

- `mobile-app` - For mobile-specific discussions
- `api-design` - For API-related meetings
- `vendor-management` - For vendor/contractor discussions
