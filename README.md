# Dunk & Spike — Championship Athletics Portal

An enterprise sports portal and live court scoring console built for sanctioned collegiate basketball and volleyball championships. Fully compliant with official **FIVB / Volleyball Nations League (VNL)** scoring guidelines and **FIBA / NCAA** basketball rules.

---

## ⚡ Core Features

### 🏐 Volleyball (FIVB / VNL Tournament Rules)
* **Match Formats**:
  * **Best-of-5 Sets**: Sets 1–4 played to 25 points; deciding Set 5 (tiebreaker) played to 15 points.
  * **Best-of-3 Sets**: Sets 1–2 played to 25 points; deciding Set 3 (tiebreaker) played to 15 points.
* **Win-by-2 & Deuce Mechanics**:
  * Deuce triggers at `24–24` in 25-point sets and `14–14` in 15-point deciding sets.
  * No point ceiling: target score advances dynamically (`26`, `27`, `28`...) until a 2-point margin is established.
* **FIVB Rule 18.2 Deciding Set Court Switch**:
  * Automatic visual alert to change courts immediately when either team reaches 8 points in the deciding set.
* **FIVB Rule 21 Sanctions**:
  * Yellow Card (Formal individual warning recorded on official scoresheet).
  * Red Card (Penalty: +1 point awarded to opponent and service handover).
* **Official 30-Second Timeout Timer**:
  * Interactive countdown with synthetic referee whistle chirp and arena buzzer.

### 🏀 Basketball (FIBA / NCAA Rules)
* **Quarter Progression**:
  * 4 regulation quarters with Overtime (`OT1`, `OT2`...) automatically triggered when tied at the end of Q4.
* **Team Fouls & Bonus Penalty**:
  * Tracks team fouls with live `PENALTY BONUS` indicator upon committing 5 or more fouls in a quarter.
* **Game Clock & Shot Clock**:
  * Dual timers with 24s/14s resets and interactive Game Clock controls.
* **Full Box Scoring**:
  * +1 FT, +2 FG, +3 3PT, -1 Score Correction, Team Fouls, and Timeouts.

### 📜 Official Scoresheet & Reporting
* Sanctioned scoresheet modal formatted for print and PDF export with team rosters, set-by-set / quarter-by-quarter breakdown, and referee audit signatures.

---

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
# Running on http://127.0.0.1:3000/
```

### Automated Unit & Integration Testing
```bash
npm test
# Runs 23 comprehensive tests using Vitest
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker Container Deployment
```bash
docker build -t dunk-and-spike:latest .
docker run -d -p 8080:80 dunk-and-spike:latest
# Access at http://localhost:8080/
```

---

## 🧪 Test Coverage Summary
* **`src/utils/volleyballRules.test.ts`**: 14 tests covering base targets, 25/15 pt set transitions, uncapped deuce scenarios, deciding sets, and Rule 18.2 court switches.
* **`src/utils/basketballRules.test.ts`**: 7 tests covering bonus foul calculations, quarter advancement, and mandatory overtime evaluation.
* **`src/utils/matchSimulation.test.ts`**: 2 comprehensive end-to-end integration simulations of complete championship matches.

---

## 🏛️ License
Sanctioned for Collegiate & Championship Athletics Tournament Operations.
