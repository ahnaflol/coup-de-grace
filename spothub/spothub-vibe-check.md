# Application Context

SpotHub is a CRM (Customer Relationship Management) application built with Next.js. It has no authentication - anyone who opens it has full access. The app has a dark sidebar on the left with navigation links and a white topbar with a search bar, a "+" quick-create button, and a user avatar "JD".

The root URL `/` redirects to `/dashboard`. The sidebar links are: Dashboard, Contacts, Companies, Deals, Tickets, Import, and Settings (at the bottom).

## Key Pages

- **Dashboard** (`/dashboard`): Shows 4 metric cards (Total Contacts, Total Companies, Open Deals, Open Tickets) and a "Recent Contacts" table with the 5 most recently created contacts.
- **Contacts** (`/contacts`): Data table with search, filters (Lifecycle Stage, Owner), sortable columns, and pagination. Columns: Name, Company, Lifecycle Stage, Owner, Phone, Last Activity, Created. A "Create contact" button opens a modal form. Clicking a row navigates to the contact detail page.
- **Companies** (`/companies`): Data table with filters (Industry, Company Size, Owner). Columns: Name, Industry, Size, Revenue, City, Owner, Created. A "Create company" button opens a modal. Row click goes to detail.
- **Deals** (`/deals`): Data table with filters (Stage, Priority, Owner). Columns: Deal Name, Amount, Stage, Close Date, Company, Contact, Owner, Priority. Row click goes to detail.
- **Tickets** (`/tickets`): Data table with filters (Status, Priority, Category, Owner). Columns: Subject, Status, Priority, Category, Contact, Company, Owner, Created. Row click goes to detail.
- **Import** (`/import`): CSV upload page for bulk-importing contacts. Supports drag-and-drop or click-to-browse. Shows a preview of first 5 rows. Has a "Download Template" button.
- **Settings** (`/settings`): Placeholder page with 3 "Coming soon" cards.

## Detail Pages

All detail pages (contacts, companies, deals, tickets) share a 3-column layout:
- **Left sidebar**: Editable property fields (click pencil icon to edit, save on blur/Enter)
- **Main content**: Activity timeline (tabs: All/Emails/Calls/Notes/Meetings) and a Notes section with a textarea to add notes
- **Right sidebar**: Associations (related entities)

## Global Features

- **Global Search** (`Cmd+K` or click search bar): Opens a command palette. Searches across all entity types. Results grouped by type. Clicking a result navigates to its detail page.
- **Quick Create** (`+` button in topbar): Dropdown to create Contact/Company/Deal/Ticket from anywhere via a simplified form.

## Data

The app comes pre-seeded with contacts, companies, deals, and tickets. Data is stored in JSON files. Owners are fictional sales rep names like "Sarah Chen", "Mike Johnson", etc.

# Test Cases

## Verify dashboard loads with metric cards
Navigate to the dashboard. Confirm that 4 metric cards are visible: "Total Contacts", "Total Companies", "Open Deals", and "Open Tickets". Each should display a number. A "Recent Contacts" table should appear below with contact entries.

## Verify sidebar navigation works for all pages
Click each sidebar link (Dashboard, Contacts, Companies, Deals, Tickets, Import, Settings) one at a time. Each should navigate to the corresponding page without errors. The active page should be visually highlighted in the sidebar with an orange left border.

## Search contacts using the search bar on the contacts page
Navigate to the Contacts page. Type a name into the search bar above the table. The table should filter to show only contacts matching the search term.

## Click a contact row to view contact detail
Navigate to the Contacts page. Click on any contact row in the table. Verify whether the contact detail page loads correctly showing the contact's information, or if an error/404 page appears.

## Create a new contact using the Create button
Navigate to the Contacts page. Click the "Create contact" button. Fill in First Name, Last Name, and Email fields. Select a Lifecycle Stage of "Subscriber". Click Save. Check what lifecycle stage the newly created contact actually shows in the table.

## Attempt to create a new company
Navigate to the Companies page. Click the "Create company" button. Fill in the company Name and other fields. Click Save. Observe whether the company is created successfully or if an error message appears.

## Filter deals by stage
Navigate to the Deals page. Click the Stage filter button. Select one or more stage values (e.g., "Qualified to Buy"). Check whether the table actually filters to show only deals in the selected stage, or if the filter has no effect.

## Create a new ticket and check its priority
Navigate to the Tickets page. Click the "Create ticket" button. Fill in the Subject field. Set the Priority to "Low". Click Save. After the ticket is created, check what priority is actually displayed for the new ticket in the table.

## Edit a deal's amount on the detail page
Navigate to the Deals page and click on any deal. On the detail page, find the Amount field in the left sidebar. Click the edit (pencil) icon, change the amount to "5000", and save. Verify what value is displayed after saving - it should show $5,000.

## Verify deal stage badge colors
Navigate to the Deals page. Look for deals with "Closed Won" status and deals with "Closed Lost" status. Check the badge colors: "Closed Won" should logically be green (success) and "Closed Lost" should be red (failure). Report the actual colors you observe.

## Add a note to a contact's detail page
Navigate to the Contacts page and click on any contact. Scroll down to the Notes section. Type a short note in the textarea and click "Add Note". Observe whether the note is saved successfully or if an error message appears.

## Add a note to a company's detail page
Navigate to the Companies page and click on any company. Scroll down to the Notes section. Type a short note in the textarea and click "Add Note". Verify the note appears in the notes list after saving.

## Check the Notes tab in the activity timeline
Navigate to any contact's detail page. In the activity timeline section, click on the "Notes" tab. Check whether any notes are displayed under this tab, or if it always shows empty even when notes exist under other tabs.

## Test global search with Cmd+K
Press Cmd+K (or click the search bar in the topbar). Type a known contact or company name. Verify that search results appear grouped by type (Contacts, Companies, Deals, Tickets). Click on a result and verify it navigates to the correct detail page.

## Use the Quick Create menu to create a contact
Click the "+" button in the topbar. Select "Contact" from the dropdown. Fill in the basic fields and submit. Verify the contact is created and can be found on the Contacts page.

## Test pagination on the contacts page
Navigate to the Contacts page. If there are multiple pages of contacts, click the next page button. Verify that different contacts appear on page 2 and that there is no overlap with page 1 data (check if the last contact from page 1 appears again at the start of page 2).

## Test CSV import with the template
Navigate to the Import page. Click "Download Template" to get the CSV template. Then try uploading a CSV file or observe the import interface. Check that the page loads correctly and the drag-and-drop area is functional.

## Filter contacts by lifecycle stage and then reset
Navigate to the Contacts page. Apply a Lifecycle Stage filter (e.g., select "Lead"). Verify the table filters correctly. Then click the "Reset" button to clear all filters. Check whether ALL filters are properly cleared, including the Lifecycle Stage filter.

## Test the Settings page
Navigate to the Settings page via the sidebar. Verify that the page loads and shows placeholder cards for Profile, Notifications, and Integrations, each marked as "Coming soon".

## Verify the Open Deals count on the dashboard
Navigate to the Dashboard. Note the "Open Deals" count. Then navigate to the Deals page and manually count or filter for only open deals (excluding "Closed Won" and "Closed Lost"). Compare whether the dashboard count matches the actual number of open deals.

## Edit a contact's properties on the detail page
Navigate to any contact's detail page (try via Companies > click company > click an associated contact, or navigate directly). Try editing a field like the phone number by clicking the pencil icon, typing a new value, and pressing Enter or clicking away. Check if the change persists after refreshing the page.

## Test company detail associations
Navigate to the Companies page and click on a company that has associated contacts. On the detail page, check the right sidebar for associated Contacts, Deals, and Tickets. Verify that the associations section shows related entities.
