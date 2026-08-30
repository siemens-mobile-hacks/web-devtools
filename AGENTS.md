# Project Guidelines

## Core Principle

Follow the code style, architectural decisions, and approaches already established in the project. Before making changes, study the surrounding code and configuration. Match the author's style: existing project conventions take precedence over personal preferences.

## Change Requirements

- Write clean, clear, and maintainable code.
- Choose the simplest solution that fully addresses the task.
- Do not produce AI slop: avoid boilerplate comments, unnecessary verbosity, redundant checks, wrappers, and abstractions.
- Do not overengineer or generalize prematurely.
- Fix the underlying cause instead of stacking patches or compatibility layers.
- Do not preserve duplicate implementations or compatibility code for behavior that has not shipped.
- Follow the project's established naming, file structure, formatting, and error-handling conventions.
- Whenever the user establishes or clarifies a project code-style rule, immediately record it in `AGENTS.md`.
- Before implementing helper logic or adding an abstraction, always inspect the existing project utilities and reuse an established utility when it fits.
- In multiline ternary expressions, keep `?` and `:` at the end of the preceding line.
- Prefer multiline JSX for nested elements; do not compress parent and child tags onto one line merely to save space.
- Do not use namespace imports (`import * as ...`); use explicit named imports instead.
- Use braces for an `if` statement whenever it has an `else` branch or its body spans multiple lines.
- Do not refactor or reformat code outside the scope of the current task unless necessary.
- Do not add dependencies when the task can reasonably be solved with the existing tools.
- Always ask the user for explicit confirmation before installing a new dependency.
- Preserve existing behavior and public interfaces unless the task explicitly requires changing them.
- After making changes, run the relevant project checks and fix any errors caused by the changes.

## SolidJS

- Strictly follow SolidJS's reactive model and idioms.
- Do not impose React approaches or its mental model on SolidJS code.
- Use signals, memos, effects, and stores according to their intended roles in SolidJS, preserving fine-grained reactivity.
- Avoid React patterns such as destructuring reactive props, unnecessary effects, manual state synchronization, and components designed around re-renders.
- Use lifecycle hooks for DOM measurement; do not defer layout work with `queueMicrotask` when the component lifecycle can express the correct timing.
- When a component requires data to render, make the prop required and handle conditional rendering at the caller instead of wrapping the entire component in `Show`.
- Avoid unnecessary JSX fragments; use the existing semantic or layout container when sibling elements share one.
- Before introducing a custom reactive abstraction, check whether the task can be solved more simply with SolidJS primitives and the project's existing patterns.

## UX

- Follow the existing Bootstrap and solid-bootstrap visual language; reuse nearby layout and interaction patterns before adding custom styles or components.
- Keep tool interfaces compact: prefer small controls, dense tables, concise action rows, and `mb-2`/`mb-3` spacing over cards, large headings, and excessive whitespace.
- Maximize useful information density: every visible element should support the current task, and labels or explanatory text should not repeat context that is already clear.
- Prefer single-line toolbars for secondary actions and numeric options, and compact inline lists for selectable collections.
- Do not use horizontal scrolling as a layout solution. Reflow or wrap controls, adapt the layout at narrow widths, and remove nonessential information instead.
- Do not use `table-layout: fixed`. Let columns size naturally from their content; percentage widths may be assigned to individual columns when proportions need to be controlled.
- Keep the primary workflow visible and group related controls in one row when practical. Let controls wrap responsively on narrow screens.
- Use modals for focused secondary configuration, not for primary actions or information that belongs on the page.
- Preserve accessibility with explicit labels or accessible names, visible status and error feedback, and keyboard-operable controls.
- Keep tables within the available width and preserve identifying context when results from multiple sources are combined.
- Use Playwright only for complex or high-risk UI scenarios where browser behavior materially needs verification, and only after the interface is complete. Do not run it for routine changes when the implementation and static checks provide sufficient confidence, or after each intermediate UI change.
