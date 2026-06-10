# Implementation Plan — Phase 24: Global GrowWave UI Refinement

Perform a comprehensive system-wide design polish of GrowWave. Eliminate boxy, outline-heavy "admin template" elements (borders, gridlines, dark separators) and implement a modern, minimalist floating SaaS interface inspired by Linear, Stripe, and Notion.

## User Review Required

> [!IMPORTANT]
> - **Unified Page Backgrounds**: All layouts (Lite layout, Pro layout, Admin layout, Landing page) will have a locked background of `#FCFAF6` (official surface color) with no white/dark background panels for page backdrops.
> - **Premium Card Shadows**: Cards will use `border-0` and float using a shadow system:
>   - Default: `shadow-card` (configured as `0 2px 8px rgba(15, 23, 42, 0.04)`)
>   - Hover: `hover:shadow-card-hover` (configured as `0 8px 24px rgba(15, 23, 42, 0.08)`)
>   - Corner Radius: `rounded-2xl` (16px)
> - **Button Radius Lock**: Primary buttons will have a corner radius of `12px` (`rounded-xl` instead of `rounded-lg` or `rounded-2xl`) and no borders.
> - **Lite Sidebar Cleanup**: Refactor Free user sidebar to match Pro design: Background `#FCFAF6`, border-right `1px solid #EEF2F7`, borderless menu items. The active items will use a light green surface (`bg-[#F0FDF4]`) background with no outlines.
> - **Table Styling**: Gridlines will be removed globally. Rows will use soft dividers (`border-[#EEF2F7]`) and hover transitions. Table headers will use transparent backgrounds.
> - **Modal Polish**: Restyle the GrowWave modal component to use `shadow-modal`, `rounded-2xl` (16px), border-0, and ensure confirm/cancel buttons use `rounded-xl` (12px).

## Proposed Changes

### 1. Global Layouts & Sidebars

#### [MODIFY] [layout.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/layout.tsx)
- Force main page background to `bg-[#FCFAF6]` (or `bg-[var(--bg-main)]`) and remove dark-mode background overrides.

#### [MODIFY] [sidebar.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/components/free-user/sidebar.tsx)
- Set container style to: background `#FCFAF6`, border-right `1px solid #EEF2F7`.
- Remove header border-b and bottom profile border-t, replacing them with clean spacing.
- Update active navigation item style to use `bg-[#F0FDF4]` background, `text-[#22C55E]` color, and zero borders.
- Update hover state to use `hover:bg-[#F0FDF4]/50`.

#### [MODIFY] [top-navbar.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/components/free-user/top-navbar.tsx)
- Update header container to use `border-[#EEF2F7]` and height `h-16`.
- Update search input to use `bg-[#F8FAFC]` background and `border-0`.

#### [MODIFY] [top-navbar.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/components/dashboard/top-navbar.tsx)
- Update header container to use `border-[#EEF2F7]` instead of `#E5E7EB`.

### 2. Custom Modals & Controls

#### [MODIFY] [growwave-modal.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/components/growwave-modal.tsx)
- Remove border outlines (`border-0`) on the dialog card, and use `shadow-modal` directly.
- Update action buttons: Set corner radius to `rounded-xl` (12px) for both confirm and cancel actions.
- Replace any hardcoded neon colors.

### 3. Free User Dashboard Pages

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/create/page.tsx)
- Refactor compose section, template checklist, and kanban cards:
  - Remove all card border outlines (`border-0` or `border-none`).
  - Set backgrounds to `#FFFFFF` and apply `shadow-card hover:shadow-card-hover transition-all duration-300`.
  - Ensure kanban column backdrops use `#FCFAF6` page-surface backgrounds without outline borders.
  - Set buttons to use `rounded-xl` (12px) and no borders.
  - suggested prompts/actions: Render as borderless pills with background `#F0FDF4` and text `#22C55E`.

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/publish/page.tsx)
- Remove card borders on the post items list and search bar block.
- Set backgrounds to `#FFFFFF` and apply `shadow-card hover:shadow-card-hover transition-all`.
- Update buttons to use `rounded-xl`.

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/scheduled/page.tsx)
- Remove outlines on scheduled queue cards and limits progress bar card.
- Apply `shadow-card hover:shadow-card-hover transition-all` to items.
- Ensure form inputs use `#F8FAFC` backgrounds and minimal border outlines.

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/calendar/page.tsx)
- Remove outlines on calendar containers, event pills, and detail modals.
- Apply `shadow-card` to calendar month/week cards.
- Ensure header controls use `rounded-xl` buttons.

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/settings/page.tsx)
- Remove outlines on profile settings cards and input sections.
- Apply `shadow-card hover:shadow-card-hover transition-all` to settings panels.
- Update delete account panel to use soft shadows rather than red outline borders.

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/ai-assistant/page.tsx)
- Remove all panel borders and outlines.
- Update prompt options, limits tracker, and logs sidebar to use `shadow-card`.
-suggestedPrompts & Tone selects: Use borderless pills (`bg-[#F0FDF4]`, `text-[#22C55E]`).
- Chat message bubble styling: Clean Claude-like message blocks, removing borders and using `#F0FDF4` (user) and `#FCFAF6` (AI assistant).

### 4. Admin Dashboard

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/admin/page.tsx)
- Sidebar: Update to `bg-[#FCFAF6] border-r border-[#EEF2F7]`. Remove border-b on the header brand and border-t on the logout footer.
- Header: Update background to `bg-[#FCFAF6]/80` and border-b to `border-[#EEF2F7]`.
- Stats Grid Cards: Remove `border border-[#EAEAEA]` and apply `border-none shadow-card hover:shadow-card-hover transition-all duration-300 rounded-2xl bg-white`.
- Table Containers: Remove `border border-[#EAEAEA]` and use `border-none shadow-card rounded-2xl bg-white`.
- Tables Gridlines:
  - Remove cell grid lines.
  - Set table headers to `bg-transparent border-b border-[#EEF2F7]`.
  - Set row items to `border-b border-[#EEF2F7]`.
- Charts Container: Remove borders and focus the visual highlight strictly on the SVGs.

### 5. Landing Page Refinement

#### [MODIFY] [index.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/components/navbar/index.tsx)
- Update landing header class: Remove `border-b border-border/70 bg-white/85`, replace with `border-b border-[#EEF2F7] bg-[#FCFAF6]/85`.

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/page.tsx)
- Replace card border classes (`border-border/80`) with `border-0 shadow-card hover:shadow-card-hover transition-all`.
- Ensure buttons use `rounded-xl`.

## Verification Plan

### Automated Checks
- Run `npm run build` to verify that all modifications compile without type or layout errors.

### Manual Verification
- Check all routes (/free-user/create, /free-user/publish, /free-user/settings, /admin, /) and verify:
  1. No outlines or harsh borders remain on cards, tables, or navigation components.
  2. Modals render floatingly with the custom GrowWave layout.
  3. Table rows use row dividers, not gridlines.
  4. Buttons are uniformly rounded to 12px.
