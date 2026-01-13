# Project Overview

A comprehensive, stealth-oriented data collection and intelligence platform. This tool seamlessly integrates client-side information gathering with automated reporting via a modern, accessible web interface.

---

## ✨ Core Features

### 🕵️‍♂️ Intelligence & Data Collection
- **Keystroke Logging:** Silently captures and records user keyboard input.
- **Geolocation Pinpointing:** Retrieves precise geographic coordinates (with user consent where required).
- **IP Intelligence:** Identifies the user's real public IP address and associated network data.
- **VPN/Proxy Detection & Evasion:** Actively identifies the use of privacy tools and employs techniques to attempt to uncover the originating IP.
- **OSINT Gathering:** Automates the collection of publicly available information related to the target.

### 📨 Automated Reporting
- **Integrated Email Delivery:** Utilizes the **Resend API** for reliable, programmatic dispatch of collected intelligence reports directly to a specified inbox.

### 💻 Frontend Application
- **Fully Responsive Design:** Provides an optimal experience across all devices (desktop, tablet, mobile).
- **Keyboard Navigation:** Fully operable using only a keyboard for enhanced accessibility.
- **Multi-Step Form Interface:**
    - Guides the operator through a logical, 6-step sequential workflow.
    - Features a dynamic visual progress indicator.
    - **Customizable Frontend:** The form's appearance and steps can be modified to suit different operational needs.

---

## ⚙️ Technical Architecture

This project is divided into two primary components:
1.  **Client-Side Module:** Executes in the target environment to perform data collection and evasion.
2.  **Control Frontend:** A React/Vue.js-like application that manages operations, displays gathered intelligence, and triggers reports.

The components communicate via a secure backend, which processes data and handles email automation through Resend.
