# Arcana — Frontend

The browser interface for Arcana, a personal document assistant. Built with React, TypeScript, Vite, and Tailwind CSS. Designed in Figma.

This repo is the **source of truth for all design and UX decisions**. The backend (`Arcana_backend`) adapts to match this interface, never the other way around.

---

## Prerequisites

- Node.js 18+
- The backend running at `http://localhost:8000` (see `Arcana_backend`)

---

## Getting Started

```bash
npm install       # first time only
npm run dev       # starts the dev server at http://localhost:5173
```

Open **http://localhost:5173** in any browser.

For a full setup guide including the backend and overlay app, see the `Arcana_backend` README.

---

## Environment

Create a `.env` file in this directory (copy from `.env.example`):

```
VITE_API_BASE_URL=http://localhost:8000
```

This is the only variable needed. The frontend talks to the backend at this address for all API calls.

---

## Technology Stack

| Technology | Role |
|-----------|------|
| React 18 + TypeScript | UI framework |
| Vite | Dev server and build tool |
| Tailwind CSS 4 | Styling |
| shadcn/ui + Radix UI | Accessible UI components (dropdowns, dialogs) |
| Lucide React | Icons |
| Figma | Source design (design-first approach — Figma before code) |

---

## Key Features

- **Streaming chat** — answers appear word by word via Server-Sent Events; a red ✕ button cancels mid-stream
- **Source attribution** — each answer shows a source bubble; clicking it opens the file in macOS Finder
- **File upload** — upload `.md` and `.txt` files directly from the sidebar ("Sync here")
- **Conversation history** — all conversations persisted in the backend database; pin (max 3) or delete from the sidebar
- **Out-of-scope dialog** — when a question is not in the knowledge base, offers Google, ChatGPT, or Claude as alternatives
- **Model selector** — shows Qwen 3 and Gemma 4 labels (both currently route to Gemini on the backend)
- **Overlay-aware** — the collapse/expand button and `window.electronAPI` integration only activate inside the Electron overlay; the button is hidden in the browser

---

## Repository Structure

```
src/
├── app/
│   └── App.tsx          # Single root component — all state and UI logic
├── api/
│   ├── client.ts        # API calls: streamQuery, getConversations,
│   │                    # deleteConversation, uploadFile, revealFile
│   └── types.ts         # TypeScript interfaces matching backend SSE/REST contract
└── imports/
    └── *.png            # Logo and model icons
```

---

## API Contract

The frontend communicates with the backend via:

- `POST /query/` — SSE stream; emits `chunk`, `done`, `out_of_scope`, `error` events
- `GET /conversations/` — history list
- `GET /conversations/{id}` — messages for a conversation
- `DELETE /conversations/{id}` — delete a conversation
- `POST /ingest/upload` — upload a file
- `GET /files/reveal?path=...` — open a file in Finder

---

*Arcana — built by Ignacio, 2026*
