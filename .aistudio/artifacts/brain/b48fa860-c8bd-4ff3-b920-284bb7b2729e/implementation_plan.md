# VakyaReel Studio — Multi-Language & Tinglish Reel Captioning & Kinetic Typography Engine

VakyaReel Studio is a high-speed vertical video and reel captioning studio that transforms any uploaded video into an engaging, kinetic-captioned reel across **Tinglish**, **English**, **all major Indian languages**, and their **Romanized colloquial scripts** (Hinglish, Tanglish, Kanglish, Manglish). Users can switch tracks instantaneously, stack dual-line captions, customize kinetic word-by-word animations and multi-script typography, and export either a burned-in animated video or standard subtitle/transcript files (`SRT`, `VTT`, `JSON`).

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions incorporate your confirmed preferences from our planning questionnaire:

- **Confirmed Decision 1 — Comprehensive Indian Language & Romanized Script Matrix**: Full support for **Tinglish (Telugu in Latin script)**, **English**, **Native Telugu (తెలుగు)**, plus **Hindi / Hinglish**, **Tamil / Tanglish**, **Kannada / Kanglish**, **Malayalam / Manglish**, **Marathi**, **Bengali**, **Gujarati**, **Punjabi**, and **Odia**.
- **Confirmed Decision 2 — Switchable Tracks + Dual-Line Stacked Display**: Users can view a single active script track (e.g., pure Tinglish or pure Telugu) OR enable **Dual-Line Stacked Mode** (e.g., bold animated Tinglish on the primary line with synchronized English or Native Telugu underneath).
- **Confirmed Decision 3 — Complete Export Suite**: Includes real-time HTML5 Canvas + MediaRecorder **Burned-In Animated Video Export (`.webm`/`.mp4`)** alongside instant **`.SRT`**, **`.VTT`**, and **`.JSON`** multi-track transcript downloads.
- **Fast Audio-First Extraction Strategy**: To ensure caption generation is ultra-fast regardless of video file size, the browser extracts and compresses the audio stream client-side via Web Audio API before sending it to the server-side Gemini multimodal pipeline (`gemini-3.8-flash` / `gemini-3.5-transcribe`), returning synchronized word-level and phrase-level timestamps across core scripts in a single pass.

---

## 1. Overview & Core Concept

- **What It Does**: Creators upload any vertical reel or video (or test immediately with built-in Indian creator sample reels). The app extracts audio in milliseconds, generates accurately timed captions with word-level pacing in Tinglish, English, Native Script, and any selected Indian language, and renders real-time kinetic caption animations on a 9:16 vertical stage.
- **Target Audience / Persona**: Short-form video creators, regional Indian content producers, social media editors, and educators who speak in natural code-mixed Indian languages (like Telugu-English / Tinglish) and need studio-grade animated captions without tedious manual transliteration.
- **Key Value**: Eliminates slow video uploads and awkward machine translations by natively understanding conversational code-switching (Tinglish/Hinglish/Tanglish) while pairing Indian script fonts with punchy, creator-ready word-by-word animations.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Upload or Instant Sample Reel Selection**: Drag-and-drop any video file (MP4, WebM, MOV) onto the studio dropzone, record directly from the camera, or load a pre-bundled sample reel to test styles immediately.
2. **Fast Multi-Script Caption Generation**: Select the spoken source language (Auto-Detect, Telugu/Tinglish, Hindi/Hinglish, Tamil/Tanglish, etc.) and click **Generate Fast Captions**. Client-side audio extraction feeds the server-side Gemini endpoint to produce synchronized tracks for **Romanized (Tinglish/Hinglish)**, **English**, and **Native Script** simultaneously, with one-click expansion to 10+ other Indian languages.
3. **Track Switching & Dual-Line Stacking**: Toggle between single-track mode and **Dual-Line Stacked Mode** (e.g., Primary: *Tinglish* + Secondary: *English* or *Native Telugu*), and edit any word, transliteration, or timestamp inline on the synchronized transcript timeline.
4. **Typography, Style Presets & Kinetic Animations**: Pick from curated creator presets (*Hormozi Punch*, *Tinglish Neon Pop*, *Cinema Editorial*, *Minimal Glass Box*, *Karaoke Word Fill*, *Tollywood Kinetic*) and fine-tune font family, word highlight colors, stroke thickness, background box opacity, vertical safe-zone positioning, and animation physics.
5. **Export & Download**: Export the final reel as a **Burned-In Animated Video** rendered frame-accurately via HTML5 Canvas + WebAudio stream capture, or download `.SRT`, `.VTT`, or `.JSON` files for any language track.

### Visual Identity & Theme
- **Aesthetic Direction**: **Precision Dark Broadcast Studio** — a tactile, distraction-free dark workspace (`1440px` desktop studio layout) that puts the 9:16 video viewport and high-contrast kinetic typography front and center.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - **60% Dominant Neutral Canvas**: Deep studio obsidian (`#090A0F` / `slate-950`) so vibrant video frames and caption highlights pop without glare.
  - **30% Structural Surfaces**: Crisp elevated slate panels (`#12151E` / `slate-900`) with `1px solid rgba(255,255,255,0.08)` hairline dividers—single-elevation depth with zero nested card clutter.
  - **10% Accent Budget**: Electric Saffron (`#FF5A1F`) for primary generation/export actions and Cyber Lime (`#CCFF00`) / Cyan (`#00F0FF`) for active timeline playheads and kinetic word highlights.
- **Typography & Hierarchy (2+1 Font Rule + Native Indian Script Support)**:
  - *Studio UI Display*: `Bricolage Grotesque` (600/700 weight) for workspace headers and preset titles.
  - *Studio UI Body*: `Plus Jakarta Sans` (400/500 weight) for clean scannability across controls and transcript rows.
  - *Timestamps & Timecodes*: `JetBrains Mono` with `font-variant-numeric: tabular-nums` for frame-accurate `00:00.00` alignment.
  - *Reel Caption Canvas Fonts*: Google Fonts loaded dynamically for both Latin/Tinglish display (`Outfit`, `Anton`, `Bricolage Grotesque`, `Playfair Display`, `Caveat`) and authentic Indian scripts (`Noto Sans Telugu`, `Noto Sans Devanagari`, `Noto Sans Tamil`, `Noto Sans Kannada`, `Noto Sans Malayalam`, `Noto Sans Bengali`, `Noto Sans Gurmukhi`, `Noto Sans Gujarati`).
- **Component Styling & Layout**:
  - **Top Bar Contract**: Single-row 3-zone header separated by `gap-8`: Left brand wordmark (`VakyaReel Studio`), Center 4 single-line workspace view links (`Workspace`, `Languages`, `Style & Motion`, `Export`), and Right primary CTA button (`Export Reel`).
  - **3-Column Studio Layout**:
    - *Left Panel (360px)*: Multi-Script Transcript & Timeline Editor with live search, inline text editing for Tinglish/English/Native tracks, and one-click Indian language translation generator.
    - *Center Stage (Flexible)*: 9:16 Interactive Video & HTML5 Kinetic Caption Canvas with safe-zone guides (Instagram Reels / YouTube Shorts overlay toggle), playback transport controls, and interactive timeline scrubber.
    - *Right Inspector (380px)*: Tabbed inspector for **Presets**, **Typography & Colors**, **Animation Physics**, and **Dual-Line Layout**.

### Interactive Feedback & Motion
- **8 Real-Time Caption Animation Engines**:
  1. *Karaoke Word Fill*: Active spoken word fills progressively with highlight color and scales `1.12x`.
  2. *Pop-In Spring*: Each word springs upward with elastic overshoot as it is spoken.
  3. *Box Highlight Slide*: A rounded colored highlight pill glides smoothly from word to word.
  4. *Typewriter Burst*: Rapid character-by-character reveal with rhythmic cursor pulse.
  5. *Neon Glow Pulse*: Active word ignites with a customizable neon outer aura.
  6. *Wave Bounce*: Words ripple vertically in a sine wave locked to speech cadence.
  7. *Word-by-Word Stomp*: High-impact single or 2-word center-frame slam for fast-paced reels.
  8. *Fade & Blur Cinema*: Smooth optical blur-to-sharp entrance for documentary/cinematic reels.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Audio Extraction + Single-Pass Multi-Track Generation**
  - *Chosen Approach*: Extract a lightweight mono 16kHz WAV/MP3 audio buffer in the browser before calling `/api/captions/generate`, requesting structured JSON with synchronized segments containing `tinglish` (or active Romanized script), `english`, and `nativeScript` simultaneously, plus estimated word timings.
  - *Why*: Uploading a 50MB raw 4K video over HTTP is slow; extracting the audio track in the browser takes under 400ms and shrinks the payload by 95%, making Gemini transcription and Tinglish/English/Native caption generation blazingly fast.
  - *Alternatives Considered*: Uploading full raw video files to the server (rejected due to upload latency and payload bottlenecks).

- **Decision 2: Dual HTML5 Canvas + DOM Overlay Rendering Engine**
  - *Chosen Approach*: Render the video and kinetic animated captions onto a high-DPI HTML5 `<canvas>` synchronized with `requestAnimationFrame`.
  - *Why*: Guarantees 100% visual parity between live preview and the **Burned-In Video Export** (via `canvas.captureStream(60)` combined with the video's `AudioContext` media stream), so exported videos include every font, stroke, emoji, dual-line stack, and word animation.
  - *Alternatives Considered*: Pure CSS DOM overlays (rejected because CSS overlays cannot be directly recorded into a downloadable video file in the browser).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar (3-Zone Contract)                      │
│  [VakyaReel Studio]        [Workspace · Languages · Style & Motion · Export]     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────────────────┐  ┌──────────────────────────┐  ┌───────────────────────────┐
│   Left: Multi-Language    │  │  Center: 9:16 Reel Stage │  │  Right: Style, Font &     │
│    Transcript & Tracks    │  │  & Kinetic Canvas Engine │  │    Animation Inspector    │
├───────────────────────────┤  ├──────────────────────────┤  ├───────────────────────────┤
│ • Video Upload / Samples  │  │ • Synchronized <video> + │  │ • 8 Creator Style Presets │
│ • Fast Audio Extractor    │  │   60fps HTML5 <canvas>   │  │ • Animation Mode Selector │
│ • Active Track Switcher   │  │ • Safe-Zone Guide Overlay│  │   (Karaoke, Pop, Box, etc)│
│   (Tinglish / EN / Native)│  │   (Reels / Shorts UI)    │  │ • Font Family & Script    │
│ • Dual-Line Stack Toggle  │  │ • Transport & Frame      │  │   Pairing Controls        │
│ • 11+ Indian Languages    │  │   Scrubber Bar           │  │ • Stroke, Shadow, Box &   │
│   Instant Translator      │  │ • Live Word Highlighting │  │   Position Y/X Sliders    │
│ • Inline Segment & Word   │  │   & Dual-Line Renderer   │  │ • Burned-In Video +       │
│   Timestamp Editor        │  │                          │  │   SRT / VTT / JSON Export │
└─────────────┬─────────────┘  └─────────────┬────────────┘  └─────────────┬─────────────┘
              │                              │                             │
              └──────────────────────────────┼─────────────────────────────┘
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     Express Server API Proxy (/api/captions/*)                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ • POST /api/captions/transcribe — Accepts extracted audio/video base64, invokes  │
│   @google/genai (gemini-3.8-flash) with structured JSON schema to output timed   │
│   segments + word-level timestamps in Romanized (Tinglish/Hinglish), English,    │
│   and Native Script simultaneously.                                              │
│ • POST /api/captions/translate — Translates/transliterates existing timed        │
│   segments into any requested Indian language (Tamil, Kannada, Malayalam, Hindi, │
│   Marathi, Bengali, Gujarati, Punjabi, Odia) in both Native & Romanized script.  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **`CaptionSegment`**:
  - `id`: Unique segment identifier
  - `startTime` / `endTime`: Float seconds (`tabular-nums` formatted)
  - `tracks`: Record mapping language/script keys (`tinglish`, `english`, `telugu`, `hindi`, `hinglish`, `tamil`, `tanglish`, `kannada`, `kanglish`, `malayalam`, `manglish`, `marathi`, `bengali`, `gujarati`, `punjabi`, `odia`) to `{ text: string, words: WordTiming[] }`
- **`CaptionStyleConfig`**:
  - `presetId`: Active preset identifier
  - `animationType`: `'karaoke' | 'pop' | 'box-slide' | 'typewriter' | 'neon-glow' | 'wave' | 'stomp' | 'cinema-fade'`
  - `displayMode`: `'single' | 'dual-stacked'`
  - `primaryTrack`: Track key (default `'tinglish'`)
  - `secondaryTrack`: Track key (default `'english'` or `'telugu'`)
  - `fontFamily`, `fontSize`, `fontWeight`, `textTransform`, `primaryColor`, `highlightColor`, `strokeColor`, `strokeWidth`, `backgroundColor`, `backgroundOpacity`, `positionY`, `wordsPerLine`, `animationSpeed`

### Interactive Component & State Mapping
- **Video Upload & Sample Loader**: Handles file validation, object URL creation, metadata inspection (duration/aspect ratio), and automatic client-side audio extraction using `OfflineAudioContext` to produce a compact WAV base64 payload. Also includes a built-in synthesized demo reel with sample Telugu/Tinglish voiceover audio so users can test every animation and language immediately.
- **Multi-Track Transcript Editor**: Clicking any segment seeks the video player to `segment.startTime`. Editing text in any language track immediately updates the word array and re-renders the live 60fps canvas preview.
- **On-Demand Indian Language Expansion**: Selecting any additional Indian language triggers `/api/captions/translate`, populating both the native script (e.g., Tamil `தமிழ்`) and Romanized script (`Tanglish`) while preserving exact segment and word timing.
- **Export Engine**:
  - *SRT / VTT / JSON*: Formats the active track (or dual-stacked tracks) into spec-compliant subtitle files and triggers instant browser download.
  - *Burned-In Video Export*: Plays the video from `0:00` to completion while capturing the composite `<canvas>` video track and `AudioContext` destination track via `MediaRecorder`, displaying a real-time progress bar and downloading the finished captioned video file.
