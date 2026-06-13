# PassTheTag

PassTheTag is a real-time multiplayer browser tag game built with React, Vite, Phaser 3, Supabase Realtime, Zustand, and Tailwind CSS.

## Features

- Create or join rooms with a 6-character room code
- No authentication required
- Up to 8 players per room
- Host controls for map selection and round duration
- Three maps: Grassland, Winter Arena, Desert Ruins
- Smooth WASD movement with client-side prediction
- Realtime movement and tag broadcasts through Supabase
- Round timer, scoreboard, and automatic round progression

## Tech Stack

- React + Vite
- Phaser 3
- Supabase PostgreSQL and Realtime Channels
- Zustand
- Tailwind CSS
- TypeScript

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example`:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Apply the SQL migration in `supabase/migrations/0001_init.sql` to your Supabase project.

4. Start the dev server:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

The project is Vercel-ready. The included `vercel.json` uses `npm run build` and outputs the Vite `dist` folder.

## Project Structure

```text
src/
  components/
  game/
  hooks/
  pages/
  scenes/
  services/
  stores/
  types/
  utils/
```

## Notes

- Movement is broadcast at roughly 20 updates per second.
- Player movement is not persisted to PostgreSQL.
- Supabase is used for room data, player persistence, and realtime messaging.
