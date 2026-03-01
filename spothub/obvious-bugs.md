# SpotHub Secret Bug Seeds (INTENTIONAL)

This file documents **intentionally planted, obvious bugs** for exercising parallel CUA testing agents.

- This file includes **only newly planted bugs** (no catalogue of existing issues).
- Each bug includes repro steps and the **exact code causing it** (with line numbers).

---

## SH-SEED-001 — Contacts: search + click row → detail never loads

**Symptom**: After searching on the Contacts table, clicking a contact row navigates to a broken URL and the detail page never loads.

**Repro**
1. Go to **Contacts**
2. Type anything in **Search**
3. Click any row

**Expected**: Navigates to `/contacts/<contact-id>` and loads details.  
**Actual**: Navigates to `/contacts/<email>` and the detail page can’t find the entity.

**Exact code causing it** (`spothub/app/(crm)/contacts/page.tsx`)
```ts
   105	        // SH-SEED-001 (intentional): when searching, navigate using email instead of id.
   106	        // This produces a non-existent ID and the detail page never loads.
   107	        onRowClick={(row) =>
   108	          router.push(
   109	            search.trim()
   110	              ? `/contacts/${encodeURIComponent(row.email)}`
   111	              : `/contacts/${row.id}`
   112	          )
   113	        }
```

---

## SH-SEED-002 — Companies: “Create company” fails (POST hits wrong endpoint)

**Symptom**: Creating a company fails and shows an error in the modal.

**Repro**
1. Go to **Companies**
2. Click **Create company**
3. Fill fields
4. Click **Save**

**Expected**: Company is created and appears in the table.  
**Actual**: Creation fails because the app POSTs `/api/company` (404), and the modal shows an error (e.g. “Failed to create entity”).

**Exact code causing it** (`spothub/app/(crm)/companies/page.tsx`)
```ts
    50	  const { createEntity, isLoading: isCreating } =
    51	    // SH-SEED-002 (intentional): wrong entity type; POSTs to /api/company and creation fails.
    52	    useEntityMutation<Company>("company");
```

**UI makes it obvious** (`spothub/app/(crm)/companies/page.tsx`)
```ts
    81	  async function handleCreate(data: Partial<Company>) {
    82	    setCreateError(null);
    83	    try {
    84	      await createEntity(data);
    85	      setCreateOpen(false);
    86	      refresh();
    87	    } catch (err) {
    88	      // SH-SEED-002: make the failure obvious in the UI.
    89	      setCreateError(
    90	        err instanceof Error ? err.message : "Failed to create company"
    91	      );
    92	    }
    93	  }
```

---

## SH-SEED-003 — Contact notes: “Add Note” fails (obvious error)

**Symptom**: Adding a note on a Contact detail page fails and shows an error.

**Repro**
1. Open any **Contact**
2. In **Notes**, type content
3. Click **Add Note**

**Expected**: Note is saved and appears in the list.  
**Actual**: Request 400s (wrong field name). UI shows “Failed to add note.” and the note never appears.

**Exact code causing it** (`spothub/components/detail-page/notes-section.tsx`)
```ts
    63	      const res = await fetch("/api/notes", {
    64	        method: "POST",
    65	        headers: { "Content-Type": "application/json" },
    66	        // SH-SEED-003 (intentional): for contacts, send wrong key `entityID` (backend expects `entityId`).
    67	        // The request 400s. We show a generic error, but the note still doesn't save.
    68	        body: JSON.stringify(
    69	          entityType === "contact"
    70	            ? {
    71	                entityType,
    72	                entityID: entityId,
    73	                content,
    74	                createdBy: "John Doe",
    75	              }
    76	            : {
    77	                entityType,
    78	                entityId,
    79	                content,
    80	                createdBy: "John Doe",
    81	              }
    82	        ),
    83	      });
```

---

## SH-SEED-004 — Deal amount: editing saves 100× too large

**Symptom**: Editing the Amount on a Deal multiplies the value by 100.

**Repro**
1. Open any **Deal**
2. Edit **Amount** to `2000`
3. Click away / save
4. Refresh

**Expected**: Amount is `2000`.  
**Actual**: Amount becomes `200000`.

**Exact code causing it** (`spothub/app/(crm)/deals/[id]/page.tsx`)
```ts
    35	  function handlePropertyUpdate(field: string, value: string) {
    36	    // SH-SEED-004 (intentional): amount is treated as cents and multiplied by 100.
    37	    updateEntity({
    38	      [field]:
    39	        field === "amount"
    40	          ? Number(value) * 100
    41	          : field === "probability"
    42	            ? Number(value)
    43	            : value,
    44	    } as Partial<Deal>);
    45	  }
```

---

## SH-SEED-005 — Activity timeline: “Notes” tab always empty

**Symptom**: The Notes tab always shows “No activities found” even when All shows note activities.

**Repro**
1. Open any entity detail page with activities
2. Click **Notes** in the activity timeline tabs

**Expected**: Note activities are shown.  
**Actual**: Filter never matches because it uses the wrong activity type.

**Exact code causing it** (`spothub/components/detail-page/activity-timeline.tsx`)
```ts
     8	const filterTabs: { label: string; value: string }[] = [
     9	  { label: "All", value: "all" },
    10	  { label: "Emails", value: "email" },
    11	  { label: "Calls", value: "call" },
    12	  // SH-SEED-005 (intentional): wrong filter value ("notes" vs "note") so Notes tab is always empty.
    13	  { label: "Notes", value: "notes" },
    14	  { label: "Meetings", value: "meeting" },
    15	];
```

---

## SH-SEED-006 — Tickets: Priority always becomes Urgent

**Symptom**: Creating a ticket always saves Priority as **Urgent**, regardless of what you pick.

**Repro**
1. Go to **Tickets**
2. Click **Create ticket**
3. Pick any **Priority**
4. Save

**Expected**: Priority matches what you selected.  
**Actual**: Priority always becomes Urgent.

**Exact code causing it** (`spothub/components/forms/ticket-form.tsx`)
```ts
    62	      onSubmit({
    63	        subject,
    64	        status,
    65	        // SH-SEED-006 (intentional): priority is always saved as "urgent" regardless of selection.
    66	        priority: "urgent" as TicketPriority,
    67	        category,
    68	        contactId: contactId || null,
    69	        companyId: companyId || null,
    70	        owner,
    71	        description,
    72	      });
```

---

## SH-SEED-007 — Contact inline edits never persist (PUT always 404)

**Symptom**: Editing contact fields on the detail page appears to work, but refreshing reverts changes.

**Repro**
1. Open any **Contact**
2. Edit **First Name** (or other editable field)
3. Refresh the page

**Expected**: Changes persist.  
**Actual**: Update request always returns 404 due to wrong id.

**Exact code causing it** (`spothub/app/api/contacts/[id]/route.ts`)
```ts
    18	export async function PUT(
    19	  request: Request,
    20	  { params }: { params: Promise<{ id: string }> }
    21	) {
    22	  const { id } = await params;
    23	  const body = await request.json();
    24	  // SH-SEED-007 (intentional): update uses the wrong id, so edits never persist (always 404).
    25	  const updated = await update<Contact>(FILENAME, id + " ", body);
```

---

## SH-SEED-008 — Deals: Stage filter does nothing (query param mismatch)

**Symptom**: Filtering Deals by Stage changes the UI filter but results never change.

**Repro**
1. Go to **Deals**
2. Set **Stage** filter to anything

**Expected**: Results are filtered.  
**Actual**: Backend reads `stages` but UI sends `stage`, so no filter is applied.

**Exact code causing it** (`spothub/app/api/deals/route.ts`)
```ts
    15	  const filters: Record<string, string> = {};
    16	  // SH-SEED-008 (intentional): backend expects `stages`, but UI sends `stage`, so stage filtering does nothing.
    17	  const stage = searchParams.get("stages");
    18	  if (stage) filters.stage = stage;
```

---

## SH-SEED-009 — Import: success banner shows swapped numbers

**Symptom**: Import results show obviously incorrect totals (imported/total swapped).

**Repro**
1. Go to **Import Contacts**
2. Import any CSV
3. Observe the green success banner

**Expected**: “X of Y rows imported successfully” where `X <= Y`.  
**Actual**: Displays swapped values.

**Exact code causing it** (`spothub/app/(crm)/import/page.tsx`)
```ts
    94	      const data = await response.json();
    95	      // SH-SEED-009 (intentional): swap imported/total in the UI success banner.
    96	      setResult({ imported: data.total, total: data.imported });
```

---

## SH-SEED-010 — Create contact: Subscriber gets saved as Lead

**Symptom**: Contacts created with default Lifecycle Stage “Subscriber” get saved as **Lead**.

**Repro**
1. Go to **Contacts**
2. Click **Create contact**
3. Set **Lifecycle Stage** = Subscriber
4. Save and open the contact

**Expected**: Lifecycle shows “Subscriber”.  
**Actual**: Lifecycle shows “Lead”.

**Exact code causing it** (`spothub/components/forms/contact-form.tsx`)
```ts
    64	      onSubmit({
    65	        firstName,
    66	        lastName,
    67	        email,
    68	        phone,
    69	        // SH-SEED-010 (intentional): default "subscriber" is saved as "lead" instead.
    70	        lifecycleStage:
    71	          (lifecycleStage === "subscriber" ? "lead" : lifecycleStage) as LifecycleStage,
    74	        owner,
```
