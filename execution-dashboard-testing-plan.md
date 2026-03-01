# Application Context

Coup de Grace is a parallel browser agent testing platform built with Next.js 16, tRPC, Three.js, and React Three Fiber. It orchestrates AI-powered browser agents that run visual E2E tests in parallel, each in isolated cloud browser sessions.

The features under test are the **execution dashboard** at `/execute?planId=<id>`, specifically:

1. **3D Globe Visualization ("Preview" tab)** — An interactive rotating globe with color-coded markers for each test task. Markers show live browser previews when running, and pass/fail verdicts when completed.
2. **Results View ("Results" tab)** — A statistics dashboard showing pass/fail counts, pass rate, progress bar, task list with verdict badges, and a markdown export dialog for failed tests.
3. **Execution Header** — Tab navigation between Preview and Results, plus real-time status counters (running, completed, failed, pending).

The execution page is accessed via `?planId=<id>` query parameter. The header has two tabs: "Preview" (globe icon) and "Results" (bar chart icon). Status counters appear on the right side of the header.

The globe auto-rotates and markers are distributed using a Fibonacci sphere algorithm. Markers are color-coded: green for running (with pulse animation), dark green for completed/passed, red for failed, gray for pending. Clicking a marker opens a detail sheet panel.

The results view shows a grid of stat cards (Passed, Failed, In Progress, Pass Rate), a progress bar with green/red segments, and an individual task list. Failed tests can be exported as markdown via a dialog.

No authentication is required. The app runs on port 3000.

Known quirks: The globe uses dynamic imports and may take a moment to load the 3D canvas. Task statuses poll every 2 seconds. The detail sheet slides in from the right side.

# Test Cases

## Verify execution dashboard loads with header
Navigate to the execution dashboard page. Confirm that the page loads with a header containing the Coup de Grace branding, tab navigation options ("Preview" and "Results"), and status counters on the right side.

## Verify Preview tab is active by default
When the execution dashboard loads, the "Preview" tab should be selected/active by default, showing the 3D globe visualization area.

## Verify 3D globe renders
On the Preview tab, confirm that a 3D globe visualization renders on screen. There should be a visible wireframe sphere that auto-rotates.

## Verify globe has task markers
On the Preview tab with an active execution, confirm that colored markers appear on the globe representing individual test tasks. Each marker should display information about its associated task.

## Switch from Preview to Results tab
Click on the "Results" tab in the header navigation. The view should switch from the globe visualization to the results/statistics view. The "Results" tab should appear active/selected.

## Switch back from Results to Preview tab
After navigating to the Results tab, click the "Preview" tab. The globe visualization should reappear and the Preview tab should show as active.

## Verify Results view statistics grid
Navigate to the Results tab. Confirm that stat cards are displayed showing: Passed count, Failed count, In Progress count, and Pass Rate percentage. The cards should be laid out in a grid.

## Verify Results view progress bar
On the Results tab, confirm that a visual progress bar is displayed. The bar should show green and red segments representing the proportion of passed vs failed tests.

## Verify Results view task list
On the Results tab, confirm that there is a list of individual tasks displayed below the statistics. Each task should show its name/title and a status indicator or verdict badge (PASS/FAIL).

## Verify header status counters update
While tasks are executing, observe the status counters in the header. The running, completed, failed, and pending counts should reflect the current state of the test execution and update as tasks progress.

## Verify running task marker has pulse animation
On the Preview tab, observe a currently running task marker. It should display a breathing/pulse animation effect and appear in green color to indicate active status.

## Verify completed task marker shows verdict
On the Preview tab, after a task completes, its marker should change appearance — showing a checkmark or pass icon for successful tests, or a failure indicator for failed ones. The color should change from active green to dark green (pass) or red (fail).

## Click on a task marker to open detail sheet
On the Preview tab, click on one of the task markers on the globe. A detail panel/sheet should slide in from the right side showing more information about the selected task.

## Verify detail sheet shows task information
After opening the detail sheet by clicking a task marker, confirm it displays relevant task information such as the task title, status, and any available results or screenshots.

## Verify pending task markers are gray
On the Preview tab, any tasks that haven't started yet should display as gray markers on the globe, visually distinguishing them from running or completed tasks.

## Verify Results view shows task summaries
On the Results tab, click or expand a completed task in the task list. The task entry should display a summary of the test result describing what was verified and the outcome.

## Verify failed tests markdown export
On the Results tab, if there are any failed tests, look for an option to export failed test cases. Clicking it should open a dialog showing the failed tests formatted as markdown text.

## Verify page handles empty or waiting state
If no tasks have started yet, the execution dashboard should show an appropriate waiting state message such as "Waiting for agents..." rather than appearing broken or blank.

## Verify globe markers are distributed across the sphere
On the Preview tab with multiple task markers, confirm that the markers are evenly distributed across the globe surface rather than clustered together. They should be spread out in a visually pleasing pattern.

## Verify tab state persists during execution
Switch between Preview and Results tabs multiple times during an active execution. The data and state on each tab should remain consistent — no data loss, no stale information, and counters should stay in sync.
