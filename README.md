# CBBC-Scoreboard

# Comet Bay Bowling Club – Scoreboard System

A modern, two‑window scoreboard system built for the Comet Bay Bowling Club.  
This application provides:

- A full **Admin Control Panel** for entering results, managing teams, sponsors, backgrounds, and scoring rules.
- A dedicated **Display Window** designed for a second screen or TV.
- A **Live Preview** of the display inside the admin window.
- Automatic refreshing of ladder, results, sponsors, and backgrounds.
- A clean Electron + Express architecture for stable packaged builds.

---

## 📺 Features

### **Admin Window**
- Add/remove teams and skippers  
- Enter match results  
- Automatic ladder calculation  
- Scoring configuration (win/draw/loss points, percentage tiebreaker, auto‑winner)  
- Sponsor logo management  
- Background image rotation (single, sequential, random)  
- Club logo configuration  
- Event reset (clears teams + results)  
- Live preview of the display window  

### **Display Window**
- Full‑screen scoreboard for a second monitor or TV  
- Ladder table  
- Recent results list  
- Sponsor carousel  
- Background image rotation with overlay  
- Auto‑refresh every 15 seconds  

---

## 🗂 Folder Structure

CometBayScoreboard/
admin/
admin.html
script-admin.js
style.css
display/
display.html
script-display.js
images/
backgrounds/
sponsors/
club-logo.png
main.js
server.js
preload.js
package.json

---

## 🚀 Running the App (Development Mode)

### 1. Install dependencies
npm install


### 2. Start the app
npm run dev


This will:

- Launch the **Admin Window** on your main monitor  
- Launch the **Display Window** on your second monitor (if connected)  
- Start the Express server at `http://localhost:3000/`  

---

## 🏗 Building the Windows EXE (GitHub Actions)

This repository includes a GitHub Actions workflow that builds a Windows EXE using `electron-builder`.

### To build:

1. Go to the **Actions** tab in GitHub  
2. Select **Build Windows EXE**  
3. Click **Run workflow**  
4. Wait 2–3 minutes  
5. Download the EXE from the **Artifacts** section  

The output file will be located in:

dist/*.exe

---

## 🖼 Images & Assets

Place your images inside:

images/club-logo.png
images/sponsors/
images/backgrounds/

Paths inside the admin panel should match these locations, for example:

images/sponsors/bobs_meats.png
images/backgrounds/sunset1.jpg

---

## 🔧 Technology Stack

- **Electron** – Multi‑window desktop application  
- **Express** – Serves admin, display, and image assets  
- **HTML/CSS/JS** – Simple, clean, browser‑based UI  
- **LocalStorage** – Stores all scoreboard data  

No database.  
No backend complexity.  
Everything is local and portable.

---

## 📝 Notes

- The display window auto‑refreshes every 15 seconds  
- The admin preview iframe shows the live display  
- All data is stored locally in the browser’s LocalStorage  
- Resetting the event clears teams + results but keeps logos/backgrounds/settings  

---

## 🏆 Credits

Developed for **Comet Bay Bowling Club**  
Built to simplify event management and scoreboard presentation.
