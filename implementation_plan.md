# Implementation Plan — GrowWave Lite UI Refinement

We will redesign the GrowWave Lite Create page and refine the layout and styling, including the sidebar and the color palette, to provide a clean, premium, and focused Buffer-inspired experience.

## User Review Required

> [!IMPORTANT]
> - **Sidebar Updates**: The Channel Connection list, promotional cards ("Need team access?"), and other promotional widgets will be completely removed from the sidebar. Channels will only live in Settings, the Publish page, or inside the Connect Account modal.
> - **Unified Create Page**: The previous tabbed structure ("Content Board" vs "Post Composer") will be redesigned. The Create page will focus entirely on a premium Kanban board (Ideas, Drafts, Ready To Publish, Published) with a Quick Create Modal for adding new ideas and a Generate Ideas button powered by OpenAI.

## Open Questions

- None at this moment. The requirements are detailed and clear.

## Proposed Changes

### Theme & Colors

#### [MODIFY] [globals.css](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/globals.css)
- Add new color variables under `@theme inline` matching the requested SaaS green palette:
  - Brand green: `#30FC47`
  - Light Accent: `#EFFFF1`
  - Hover: `#DDFBE3`
  - Border: `#D9F8DF`
  - Success: `#30FC47`
  - Background: `#FFFFFF`
  - Page Background: `#FAFBFC`
  - Text: `#111827`
  - Secondary Text: `#6B7280`

---

### Sidebar Cleanup

#### [MODIFY] [sidebar.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/components/free-user/sidebar.tsx)
- Remove the channels list from the sidebar completely.
- Clean up navigation items. The sidebar menu items should strictly be:
  - Create
  - Publish
  - Scheduled
  - Calendar
  - AI Assistant
  - Settings
  - Upgrade
- Remove promotional cards (like "Need team access?").
- Add a minimal, elegant **User Profile** section at the bottom of the sidebar displaying the user's avatar, name, email, and a logout button.

---

### Create Page Redesign

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/create/page.tsx)
- **Header**:
  - Title: "Create"
  - Subtitle: "Capture ideas and turn them into social content."
- **Top Action Bar**:
  - Left: "Generate Ideas" button.
  - Right: "New Idea" button, and controls for Filters (by platform), Tags, and Sort (by date created/title).
- **Kanban Board**:
  - Exactly 4 columns: `Ideas`, `Drafts`, `Ready To Publish`, `Published`.
  - White column cards with subtle borders, 12px radius, and soft shadows.
  - Column Header: Title, Count Badge, Add Button (+), Menu Button (...) as in Buffer.
- **Empty States**:
  - When the column or board is empty, show a premium empty state: "No items yet", "Create your first content idea" and a "+ New Idea" button instead of fake cards.
- **Idea Cards**:
  - Display Title, Short Description, Tags, Created Date, Platform Badge, Status Badge, and Menu (...).
- **Drag and Drop**:
  - Implement a clean, interactive drag and drop flow (Ideas &rarr; Drafts &rarr; Ready To Publish &rarr; Published) using native HTML5 drag-and-drop event handlers for a seamless real-time UI update.
- **Quick Create Modal**:
  - Fields: Title, Description, Content Notes, Media Upload (simulated), Tags, Platform (dropdown: Facebook, Instagram, LinkedIn, etc.), AI Generate Toggle (automatically generates descriptions/caption suggestions), Save, Cancel.
- **AI Integration**:
  - "Generate Ideas" opens a modal prompting for Topic, Audience, Goal, and Platform.
  - Generates exactly 10 content ideas by calling `/api/generate` with custom instructions to return a JSON array, and automatically inserts them into the `Ideas` column.
- **Onboarding Card (First-time user experience)**:
  - Onboard message: "Welcome to GrowWave Lite. Create your first content idea to start building your social media workflow."
  - Action buttons: "Create First Idea", "Generate With AI", "Connect Account", "Dismiss".
  - Hidden immediately after any of these actions are performed.

---

## Verification Plan

### Automated Tests
- Run Next.js build: `npm run build` to ensure there are no TypeScript or compilation errors.

### Manual Verification
- Verify layout changes in the browser (spacing, padding, new SaaS green color schemes).
- Interact with the Kanban board: create new cards, drag and drop cards across columns, verify the card order and count updates in real-time.
- Verify the "Generate Ideas" button triggers the OpenAI API, parses the response, and populates 10 new ideas in the `Ideas` column.
- Verify the onboarding checklist and checklist card behaviors (dismissing and hiding).
- Verify the sidebar looks clean and contains no channels or promotional banners.
