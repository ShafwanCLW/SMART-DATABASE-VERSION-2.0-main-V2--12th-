# Responsive Remediation Plan

## Admin‑First Strategy

1. **Audit & Prioritize (Admin)**
   - Catalog every admin screen (dashboard hero/analytics, user management, Senarai KIR, Program & Kehadiran, Financial Tracking, Reports, Settings, modals).
   - For each, note rigid widths, inline styles, fixed grids, tables without overflow, and interactions (drawers/modals) that break on `<768px`.
   - Capture screenshots at 1440/1024/768/480 to set baselines.

2. **Global Responsive Tokens**
   - Confirm breakpoints, spacing, and utility classes (containers, grids, table wrappers) cover admin needs.
   - If gaps exist (drawer widths, modal padding, chart wrappers), extend shared responsive CSS before touching individual pages.

3. **Admin Dashboard Page (DONE)**
   - Hero section: convert to single-column flow below 1024px; ensure stat cards auto-fit with consistent margins; overlay panels stack while keeping gradients intact.
   - Analytics charts & cards: wrap canvases in responsive containers with fixed height ratios; add scroll/stacking for 320–768px.
   - Quick actions/summary blocks: introduce accordion or stacked layout if width <360px; validate spacing.

4. **User Management (Admin)**
   - Tables/list views: enforce horizontal scrolling with sticky headers or responsive cards for extreme narrow widths.
   - Filters/forms: grid-to-column switch, full-width search, collapsible filters on mobile.
   - Modals/wizards: limit width to viewport, add internal scroll, reduce padding.

5. **Senarai KIR / KIR Management**
   - Split large detail panes into accordion sections under 768px.
   - Sidebars collapse into drawers; ensure action buttons remain reachable.

6. **Program & Kehadiran**
   - Multi-tab sections become vertical stack; cards auto-fit with min widths.
   - Attendance tables scroll, action bars wrap, modals shrink.

7. **Financial Tracking & Reports**
   - Charts/tables follow responsive container rules.
   - Multi-column forms convert to stepper/accordion on small screens.

8. **Settings / Misc Admin Pages**
   - Ensure toggles/cards stack cleanly; align modals/drawers with shared responsive behavior.

9. **Verification (Admin)**
   - After each page, test 1024/768/640/480 via dev tools.
   - Check keyboard/focus states for drawers/accordions.

10. **User Pages (After Admin Sign-Off)**
    - Repeat per user page (dashboard, notifications, KIR embed, settings, activity).
    - Apply table/card/drawer patterns established for admin.

11. **Final QA**
    - Device-matrix testing (Chrome dev tools + iOS/Android presets).
    - Spot-check regressions on desktop (≥1200px).
    - Document responsive behaviors for future maintenance.
