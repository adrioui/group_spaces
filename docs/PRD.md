# PRD: Spaces & Group Chat with Block Notes & Lesson Pages

**Version:** 1.0  
**Author:** ChatPRD  
**Date:** 2025-09-20

---

## TL;DR

Build a social / collaboration experience centered on **Spaces** (collections of people & materials) where users can chat, share images, and create _block-based notes_ and _lesson pages_. Key differentiators: lightweight course/lesson workflow (YouTube or external links), flexible notifications on publish, and simple block types (markdown-like text + to-do lists + links). Prioritize fast, real-time chat; simple, editable block notes; and a clear publish/notify UX.

---

## Problem statement

Organizers need a single place to run small group experiences (community, micro-courses, team spaces) where they can both chat and share curated learning materials. Current chat apps separate conversation from materials (notes, lessons) and make it hard to publish content and notify the group with granular controls.

Users need:
- A fast, familiar chat for voice of the group.
- A place to create and edit modular notes and lessons that live inside a Space.
- Simple controls to notify members when content is published, or keep it quiet until ready.

We will solve this by adding Spaces (groups), real-time messaging, block-based notes, and a lesson/course flow with content gating and publish-time notification choices.

---

## Goals

### Business goals

- Increase retention and session frequency by giving users both a social (chat) and learning (material) reason to return.
- Increase organizer engagement (creators who run Spaces) by making it easy to publish lessons and notify members.
- Provide an MVP that can be evaluated quickly and scaled later with more content types.

### User goals

- Organizers can create Spaces, add members, publish lesson content, and control notifications.
- Members can join spaces, participate in chat, consume lesson content, and mark progress.
- Everyone can author and edit notes as block-based pages (text, to-do, links).

### Non-goals (MVP)

- Full LMS features (certifications, quizzes, user grading).
- File uploading beyond images for chat/profile and basic embed support (video via YouTube link).
- Complex block types (rich embeds beyond YouTube/external links) or WYSIWYG heavy editing.

---

## Personas

- **Organizer (Alice)** — runs a Space, creates lessons, wants granular notification control.
- **Member (Budi)** — participates in chat, checks new lessons, marks lessons as done.
- **Casual User (Citra)** — joins a few Spaces, sometimes posts messages and reacts to published content.

---

## MVP scope (what must exist at launch)

1. Authentication & profile editing (username / display name, profile picture options including emoji, camera, gallery, or default).
2. Spaces list (homepage) with ability to create a Space (name + profile picture) and view Space details.
3. Group chat inside Space with message send, receive, image send, and cursor-based pagination.
4. Space management: view members, invite via link, notification settings (Every message / Highlight-only), and Space info.
5. Block-based Notes pages: create, edit, save blocks of type text / to-do / link; publish toggle with notification popup.
6. Lesson pages (Course): create/edit/delete course; add topics with content (YouTube or external link), availability gating (always / after previous / custom dates), preview, publish with notification popup.
7. Simple progress UX: mark topic as done/unmark; marking done auto-advances to next available topic.

---

## User stories (mapped from your flow)

Each story includes an acceptance criterion (AC).

### Profile & Personalization

- **As a user,** I want to change the _chat wallpaper_ for a Space from neutral to "growth doodle" so the room feels personalized.  
    **AC:** Wallpaper change is saved and immediately visible to all members in the Space view.
- **As a user,** I want to edit my profile picture using an emoji, camera, gallery, or use no picture (default).  
    **AC:** Profile picture updates everywhere (chat messages, members list) immediately. Default state is shown if user clears avatar.
- **As a user,** I can edit username and display name.  
    **AC:** Changes propagate to new messages and profile views; historical messages can show old names for audit (optional).

### Homepage & Spaces

- **As a user,** I can see a list of Spaces (from the platform / my created ones or ones I join).  
    **AC:** Spaces are searchable and show basic meta (name, pp, member count).
- **As an organizer,** I can create a Space (requires name + pp).  
    **AC:** After creation, a success popup appears offering to view the Space or invite people.

### Space view (chat-centric)

- **As a member,** I can view a Space and use it like a group chat (send text and photos).  
    **AC:** Chat history loads and new messages are real-time.
- **As an organizer,** I can manage Space info, notification mode (Every message or Highlight-only), view members, and create an invite link.  
    **AC:** Notification choices affect who receives in-app/push notifications.

### Materials: Notes & Pages

- **As an organizer or member,** I can add "Material" inside a Space: notes or lesson pages.  
    **AC:** Materials are listed inside Space and can be opened and edited according to permissions.
- **Notes** (block page) — create title + body blocks (text, to-do list, link pages).  
    **AC:** Users can add/delete blocks, reorder (optional), and save. To-do items can be added and deleted.
- **To-do notifications** — when enabled, to-dos can send notifications to everyone or individually.  
    **AC:** Notification choices are presented at to-do creation or assignment and delivered accordingly.
- **Publish flow** — when publishing a note, a popup asks whether to notify the Space; if yes, a message appears in the chat: "Organizer added [title]".  
    **AC:** Choosing notify results in in-chat event posted; choosing not to notify does not.

### Lesson / Course pages

- **Create Course:** A create-course popup asks for a name; course appears in Space materials.  
    **AC:** Course can be opened and edited or deleted.
- **Topic content:** For each topic, organizer can add either a YouTube video (link + title + optional material notes) or an external link (link + title).  
    **AC:** Adding a YouTube link results in an embed preview on save.
- **Availability rules:** Topic availability can be "Always", "After previous completed", or "Custom date range". If previous topic is not complete and availability is set to "After previous", the next topic is locked ("kegembok").  
    **AC:** Locked topics are non-interactive and show unlock conditions.
- **Publish topic:** Publishing asks whether to notify; if yes, a chat event is posted.  
    **AC:** Publish + notify creates in-chat announcement; publish without notify does not.
- **Lesson navigation & progress:** Users can mark a topic as done/unmark; marking done automatically navigates to the next available topic.  
    **AC:** Mark-as-done persists per-user and drives the availability rule.

---

## UX & Flow (step-by-step highlight)

> Note: keep UI simple and familiar — left nav for spaces, center chat, right rail for materials and members.

### 1) Chat wallpaper

1. Profile → Room settings → Wallpaper.
2. Default (neutral) shown; user selects "growth doodle" preview.
3. Save → wallpaper applied to room UI immediately and persisted on Space settings.

### 2) Edit profile picture

1. Profile edit → avatar: options emoji / camera / gallery / remove.
2. Emoji PP: choose emoji; background circle color selector.
3. Camera: open camera; capture cropped image; save.
4. Gallery: upload/crop image.
5. Remove → revert to default avatar.

### 3) Create Space (homepage)

1. Homepage → Create Space → enter name + upload/select pp.
2. On success → show popup: [View space] [Invite people].
3. If invite chosen → generate link and optionally copy to clipboard / share.

### 4) Space view & chat

- Left column: Space materials (notes, lessons), members, manage.
- Center: chat feed (messages + attachments), composer at bottom.
- Right rail (optional): selected note / lesson preview.

### 5) Material creation & publish notify flow

1. Material → Create Note / Lesson.
2. Author edits blocks (text, to-do, link).
3. Author taps Publish → popup: "Notify Space?" [Yes] [No].
4. If Yes → create in-chat announcement: "[Organizer] added [Note/Topic: title]".

### 6) Lesson topic gating & navigation

- Author sets availability: Always / After previous / Custom.
- After previous: user must mark prior topic done to unlock next.
- Mark-as-done navigates to next topic automatically; unmark re-enables previous navigation.

---

## Technical considerations (high-level)

### Data model (concepts)

- **user** (id, email/username, display_name, avatar)
- **space** (id, name, avatar, wallpaper, owner_id, settings)
- **membership** (space_id, user_id, role)
- **message** (id, space_id, sender_id, content, attachments, created_at)
- **material** (id, space_id, type [note|course|topic], title, author_id, status)
- **note_block** (id, note_id, index, type[text|todo|link], payload json)
- **course** (id, space_id, title, meta)
- **topic** (id, course_id, index, content_type[youtube|external], payload, availability)
- **user_progress** (user_id, topic_id, state[done|not_done], timestamps)

Use a relational DB (Postgres) with JSONB for flexible block storage and material payloads.

### Block format suggestion (JSON)

```json
{
  "blocks": [
    { "type": "text", "content": "Regular markdown-like text" },
    { "type": "todo", "content": "Buy coffee", "checked": false },
    { "type": "link", "title": "Reference", "url": "https://..." }
  ]
}
```

### Realtime & sync

- Use WebSockets / Realtime (Supabase Realtime, Pusher, or a socket server) for chat messages and live material publish events.
- Fallback to server-sent events or polling for environments where sockets are restricted.

### Media & embeds

- Images for chat and avatar stored on object storage (S3-compatible).
- YouTube links embedded client-side (oEmbed) after server-side validation.

### Notifications

- Notification types: in-app toast, push (mobile), email (optional).
- Space-level setting: Every message / Highlight-only.
- Publish-time choice: popup chooser per-publish (Yes -> generate chat event + optionally push).
- To-dos: assignment options (all / individual) trigger notifications accordingly.

### Access control

- Roles: owner, admin, member. Only owner/admins can change Space settings and publish some content (configurable).
- Topic gating enforced server-side based on `user_progress` and topic availability rules.

---

## Acceptance criteria (by feature)

- **Profile:** Avatar and name edits persist and reflect across app within one session.
- **Create Space:** A new Space is created with provided metadata; popup shown with invite options.
- **Chat:** Messages appear in real-time to all connected members and are persisted.
- **Materials:** Notes and courses can be created, saved, edited, and listed inside Space. Publish triggers popups and optional chat events.
- **Lesson gating:** Topics can be locked/unlocked per availability rule; progress persists per-user.
- **Notifications:** Publish-time notifications create in-chat events and push/in-app events for opted recipients.

---

## Milestones & sequencing (high level)

- **Discovery & UX prototypes — XX weeks**
    - Validate flows (create space, publish popup, lesson gating), low-fi prototypes.
- **Core platform & auth — XX weeks**
    - Auth, profile editing, homepage spaces list, create space, members/invite link.
- **Chat & realtime — XX weeks**
    - Chat persistence, message realtime, image attachments, wallpaper feature.
- **Materials (Notes) — XX weeks**
    - Block editor (text/todo/link), save, edit, publish flow + notify popup.
- **Lessons / Courses — XX weeks**
    - Create course, add topics, YouTube embed/external link, availability rules, mark-as-done UX.
- **Notifications & polishing — XX weeks**
    - Implement space-level and publish-level notifications, push integration, accessibility and QA.
- **Hardening & deploy — XX weeks**
    - Monitoring, logging, load testing, finalize README & seed demo accounts.

---

## Risks & mitigations

- **Risk:** Realtime performance issues under load.  
    **Mitigation:** Use battle-tested realtime provider (Supabase, Pusher) for MVP or horizontally scaled socket servers + rate-limiting.
- **Risk:** Publish/notification spam (organizers notifying too much).  
    **Mitigation:** Provide clear defaults, rate-limits per Space, and an undo option for 
    announcements.

---

## Narrative / example scenario (short)

_Alice runs a weekly study Space. She creates a Space called "Growth Lab" and uploads a bright "growth doodle" wallpaper. On Tuesday she creates a short lesson with a YouTube walkthrough and a companion note with a to-do checklist. When she publishes the lesson she chooses to notify the Space — immediately an in-chat announcement appears: "Alice added: Week 2 — Intro to Frameworks". Budi sees the announcement, opens the lesson, watches the embedded video, marks the topic done, and the UI auto-navigates him to the next topic. The organizer sees who completed which topic and uses that to shape the next session._

---

## Implementation notes & recommended tech

- **Frontend:** Next.js (React App Router), Tailwind CSS for styles, lightweight block editor component (content editable or slate/prosekit if time allows).
- **Backend:** Node + Next API routes or serverless functions, Prisma for Postgres ORM, JSONB for block storage.
- **Realtime:** Supabase Realtime (fast integration with Postgres) or Pusher for message & publish events.
- **Storage:** S3-compatible for images.
- **Auth:** NextAuth (credentials + email) or Supabase Auth.

---

## Final notes (opinionated recommendations)

1. **Ship the chat + block notes first.** Lessons + gating are higher-value but more complex; implement them after the notes' block model is stable.
2. **Keep publish-time notification explicit.** A single popup with a clear CTA and preview reduces accidental spam.
3. **Start with simple block types.** Text + todo + link covers 90% of immediate needs.
4. **Expose a clear Progress API.** Persist user progress per topic early to support gating and analytics.
