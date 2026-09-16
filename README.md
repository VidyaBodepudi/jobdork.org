# JobDork.org

> Search for jobs directly from the company pages. Not LinkedIn!

Bypasses recruiter spam, ghost listings, and stale aggregator databases by constructing precision search engine dorks targeting authentic company career portals. <-- Isn't AI so neat. 

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-emerald.svg)
![Deployment](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange.svg)

---

## ✨ Why JobDork?

Why not? What have you got to lose? you're already here because job searching in the post-AI era I soul crushing. Might as well.

Traditional job aggregators (LinkedIn, Indeed, ZipRecruiter) have become filled with:
- **Ghost Listings**: Roles that were filled weeks ago or left active to collect resumes.
- **Bot Floods**: Thousands of automated applications within hours of posting.
- **Middleman Filters**: "Easy Apply" portals that don't always sync reliably with the company's internal ATS.

**JobDork** searches the three primary modern tech ATS platforms directly (jk not really we piggy back on dorks:
1. **Ashby** (`jobs.ashbyhq.com`) — Dominant among modern AI, developer tools, and high-growth venture-backed teams (OpenAI, Linear, Cursor, Perplexity, Ramp).
2. **Greenhouse** (`boards.greenhouse.io`, `job-boards.greenhouse.io`) — The industry gold standard for tech leaders and unicorns (Stripe, Airbnb, Figma, Datadog).
3. **Lever** (`jobs.lever.co`) — Agile venture-backed engineering and product organizations.

---

## 🚀 Features

Look. IT does things!

- **Multi-Role Querying**: Search for single roles or comma-separated titles (e.g. `Software Engineer, Full Stack`).
- **Precision Timeframe Filters**: Filter by 24 hours, 3 days, 7 days, or 30 days to apply before roles are saturated.
- **Workplace & Location Rules**: Dedicated boolean logic for Remote (`"Remote" OR "Work from anywhere"`), Hybrid, and In-Person roles with custom location inputs.
- **Noise & Junk Exclusion Engine**: Automatically negates dead pages (`-"page not found"`), closed postings (`-"no longer accepting"`), filled roles, and unpaid internships, with support for custom negative keywords.
- **Multi-Engine Support**: Seamlessly generates search syntax for Google, DuckDuckGo, Kagi, and Bing.
- **Staggered Multi-Tab Launcher**: Open dedicated search tabs for Ashby, Greenhouse, and Lever in one click.
- **Live Dork Inspector**: Visual, color-coded breakdown of every token in your search query.
- **Saved Searches & URL State**: Save your morning search routines to browser `localStorage` or share parameterized search links with colleagues.
- **100% Client-Side & Private**: Zero tracking scripts, zero cookies, zero telemetry.


## 🛠️ Local Development

You can run this project locally with any static HTTP server:

```bash
# Using Python
python3 -m http.server 8080

# Or using Node
npx serve .
```

Open `http://localhost:8080` in your browser.

---

## 📄 License

MIT License. Free to use, adapt, and share.
