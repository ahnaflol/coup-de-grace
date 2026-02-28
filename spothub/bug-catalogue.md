# SpotHub Bug Catalog

This document catalogs all intentional bugs in SpotHub CRM. These bugs exist to serve as test targets for the coup-de-grace CUA agent platform.

## Existing Bugs (5)

### BUG-01: Pagination Off-By-One
- **Category**: Data Display
- **Location**: `lib/storage.ts` - `paginate()` function
- **Severity**: Medium
- **Description**: Pages 2+ show the last item from the previous page as their first item. Page 2 of 25 shows 26 items starting from item 24 instead of item 26.
- **How to detect**: Compare the last row on page 1 with the first row on page 2 - they're the same record.
- **CUA test type**: Data extraction / pagination verification

### BUG-02: Filter Reset Skips Lifecycle Stage
- **Category**: UI
- **Location**: `components/data-table/data-table-toolbar.tsx` - `handleReset()`
- **Severity**: Medium
- **Description**: Clicking "Reset" on the Contacts table clears all filters except lifecycleStage. The dropdown appears cleared but the filter remains active in the URL/state.
- **How to detect**: Apply a lifecycle stage filter, click Reset, observe that results are still filtered (count doesn't return to full).
- **CUA test type**: UI interaction testing

### BUG-03: Property Field Focus Loss
- **Category**: Form / Data Entry
- **Location**: `components/detail-page/property-field.tsx`
- **Severity**: Low (intermittent)
- **Description**: ~25% chance the inline edit input loses focus after each keystroke due to a React key remount. Makes editing frustrating.
- **How to detect**: Try editing a property on a detail page - sometimes the cursor disappears after typing one character.
- **CUA test type**: Data entry testing

### BUG-04: Sort Null Handling
- **Category**: Data Display
- **Location**: `lib/storage.ts` - `sortItems()` function
- **Severity**: Low
- **Description**: Sorting columns with null values (like "Last Activity") scatters nulls randomly in results instead of grouping them at the top or bottom.
- **How to detect**: Sort by Last Activity and observe that "--" entries appear randomly between dated entries.
- **CUA test type**: Data extraction / sort verification

### BUG-05: Search Has No Loading Indicator
- **Category**: UI
- **Location**: `components/shared/global-search.tsx` + `app/api/search/route.ts`
- **Severity**: Low
- **Description**: Global search (Cmd+K) has a 300ms API delay with zero loading feedback. Just an awkward pause.
- **How to detect**: Open search, type a query, notice the blank pause before results appear.
- **CUA test type**: UI responsiveness testing

---

## New Bugs to Add (7)

### BUG-06: Dashboard Shows Wrong Deal Count
- **Category**: Data Display
- **Location**: `app/(crm)/dashboard/page.tsx` (new module)
- **Severity**: High - easily spotted by comparing numbers
- **Description**: The "Open Deals" summary card counts ALL deals including closed_won and closed_lost. The number will be noticeably higher than the actual count of open deals.
- **How to detect**: Compare the "Open Deals" number on the dashboard with the actual count when filtering deals by non-closed stages.
- **CUA test type**: Data verification

### BUG-07: CSV Import Silently Drops Rows
- **Category**: E2E / Data Entry
- **Location**: `app/(crm)/import/page.tsx` (new module)
- **Severity**: High
- **Description**: When importing contacts via CSV, rows where the company name contains a comma get silently skipped. No error shown, just a lower "imported" count than expected.
- **How to detect**: Import a CSV with 10 rows where 3 have commas in company names. Success message says "7 contacts imported" instead of 10.
- **CUA test type**: E2E data entry flow

### BUG-08: Notes Silently Truncate at 500 Characters
- **Category**: Form / Data Entry
- **Location**: Notes section on detail pages (new module)
- **Severity**: Medium
- **Description**: When adding a note longer than 500 characters, the note saves successfully but silently truncates to 500 chars. No warning, no error, the content is just cut off.
- **How to detect**: Add a long note (600+ chars), save it, re-open - the end is missing.
- **CUA test type**: Data entry verification

### BUG-09: Deal Stage Badge Colors Swapped
- **Category**: UI / Visual
- **Location**: `components/shared/status-badge.tsx`
- **Severity**: High - visually obvious
- **Description**: "Closed Won" shows a RED badge and "Closed Lost" shows a GREEN badge. The colors are swapped. A CUA agent looking at a won deal will see a red (danger) badge.
- **How to detect**: Look at any Closed Won deal - it has a red badge. Look at any Closed Lost deal - green badge.
- **CUA test type**: Visual / UI verification

### BUG-10: Email Validation Accepts Invalid Emails
- **Category**: Form / Data Entry
- **Location**: `lib/validators.ts` - `validateEmail()`
- **Severity**: Medium
- **Description**: The email regex accepts "user@domain" without a TLD. So "john@acme" passes validation and gets saved.
- **How to detect**: Create a contact with email "test@company" - it saves without error.
- **CUA test type**: Form validation testing

### BUG-11: Double-Click Creates Duplicate Records
- **Category**: Form / E2E
- **Location**: `components/forms/entity-form-modal.tsx`
- **Severity**: High
- **Description**: The Save button doesn't disable during submission. A quick double-click sends two POST requests, creating two identical records.
- **How to detect**: Create a contact, quickly double-click Save, check the contacts list - two identical entries appear.
- **CUA test type**: Form interaction / data integrity

### BUG-12: Stale Association After Company Change
- **Category**: E2E / Navigation
- **Location**: Contact detail page + Company detail page
- **Severity**: Medium
- **Description**: After changing a contact's company (e.g., from "Acme Corp" to "Beta Inc"), the old company's detail page still shows that contact in its associations sidebar until a hard refresh. The contact's own detail page shows the correct new company.
- **How to detect**: View contact on Company A's page, change contact's company to Company B, go back to Company A's detail page - contact is still listed there.
- **CUA test type**: E2E data consistency

---

## Summary by Category

| Category | Bug IDs | Count |
|----------|---------|-------|
| Data Display | BUG-01, BUG-04, BUG-06 | 3 |
| UI / Visual | BUG-02, BUG-05, BUG-09 | 3 |
| Form / Data Entry | BUG-03, BUG-08, BUG-10, BUG-11 | 4 |
| E2E / Navigation | BUG-07, BUG-12 | 2 |
| **Total** | | **12** |

## New Modules Required

1. **Dashboard** (`/dashboard`) - Summary cards with key metrics, recent activity feed
2. **CSV Import** (`/import`) - Upload CSV to bulk-create contacts
3. **Notes** - Notes tab/section on entity detail pages for adding free-text notes
