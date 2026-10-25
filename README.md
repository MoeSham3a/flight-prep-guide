# Emirates Flight Preparation Guide (Interactive Web Application)
**Version 5.0 (Dec 2025)**  
*For LIFUS Training & Line Operations*

[![Deploy to GitHub Pages](https://github.com/MoeSham3a/flight-prep-guide/actions/workflows/pages.yml/badge.svg)](https://github.com/MoeSham3a/flight-prep-guide/actions/workflows/pages.yml)

🌐 **Live Application**: [https://moesham3a.github.io/flight-prep-guide/](https://moesham3a.github.io/flight-prep-guide/)

---

## 🚀 Overview

This interactive web application digitizes the official 4-page **Emirates Flight Preparation Guide** (Version 5.0 Dec 2025). Designed for flight crew, trainees undergoing Line Flying Under Supervision (LIFUS), and trainers, it provides a cockpit-ready, offline-capable Electronic Flight Bag (EFB) companion for pre-flight and en-route preparation.

---

## ✨ Features

- **Exact Document Parity**: Faithful digital recreation of all 4 pages of the Emirates Flight Preparation Guide.
- **Offline-First & Zero Dependencies**: Runs directly in any web browser (Chrome, Safari, Edge, Firefox, iPad Safari) without needing Node.js or any build tools.
- **Autosave to LocalStorage**: Never lose entered briefing data; every keystroke and checkbox selection is automatically saved in your browser.
- **Day & Night Cockpit Themes**: One-click toggle between standard clean Day Mode and high-contrast Night/Cockpit Mode for flight deck use.
- **Live UTC Clock**: Real-time Coordinated Universal Time display in the header.
- **Interactive Briefings Matrix (OM-C vs OM-A/OM-D)**: Click any route area or region to instantly highlight required operational manual sections.
- **Dynamic Table Row Management**: Add or remove rows for En-route Area Threats, Waypoints/FIR Special Requirements, and En-route Alternates ("Can we..." model).
- **Quick-Tag Chips**: Clickable shortcuts for common METAR/TAF weather keywords and special FIR requirements (CPDLC, HF, SLOP, ADIZ, IFBP, CRAR).
- **Sample Flight Included (EK007 DXB → LHR)**: Single-click pre-population of a realistic Airbus A380 / Boeing 777 flight from Dubai to London Heathrow.
- **JSON Import & Export**: Save completed briefings to JSON files for record-keeping, training reviews, or sharing with an instructor.
- **Print / Save as PDF (`@media print`)**: High-fidelity print stylesheet formatted specifically for A4 portrait paper, producing the exact 4-page official document.

---

## 📂 File Structure

```text
Flight Prep Guide/
├── index.html                           # Semantic HTML5 interactive form
├── style.css                            # Day/Night themes & print layout
├── app.js                               # Autosave, UTC clock, matrix, tables & export logic
├── README.md                            # Documentation and user manual
└── Emirates Flight Preparation Guide.pdf# Source PDF document (v5.0 Dec 2025)
```

---

## 🛠️ How to Open and Use

1. **Launch in Browser**:
   - Double-click `index.html` or open it with your browser of choice (Google Chrome, Safari, Microsoft Edge).
2. **Navigation**:
   - Use the navigation tabs at the top to focus on one section at a time (`1. Preparation & Departure`, `2. En-route & Briefings`, `3. Waypoints & Aerodromes`, `4. Arrival & Alternate`), or click `📄 View All Pages` to see the entire briefing continuously.
3. **Populate a Sample**:
   - Click `📋 Sample Flight (DXB-LHR)` to immediately inspect a realistic, fully filled flight plan.
4. **Print or Save to PDF**:
   - Click `🖨 Print / PDF` or press `Ctrl + P` (or `Cmd + P` on macOS).
   - In the print dialog, select **Save as PDF** or send to your printer. The print style will format the output into clean, distinct pages matching the official template.
5. **Night Mode**:
   - Click the 🌙 button in the top right to switch to the dark flight deck theme.

---

## 🔒 Document Notice
*BUSINESS DOCUMENT — This document is intended for business use and should be distributed to intended recipients only.*
