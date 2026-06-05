# Qingchun Eye Care Clinic Chain · Customer Service Platform (DEMO)

An all-in-one customer service platform prototype for an eye-care clinic chain, built around three core scenarios: **managing customers, serving customers, and answering their questions**. It is a pure front-end implementation — just **double-click `index.html` to run**, with no dependencies to install.

> ⚕️ This project is a product prototype for demonstration purposes. All data is mock data (`data.js`) and contains no real patient information.

## ✨ Modules

| Module | Description |
| --- | --- |
| 📊 Dashboard | Key metric cards, upcoming appointments, open tickets, and customer distribution by clinic |
| 👥 Customer Management | Customer profiles, multi-dimensional filtering, and the **customer full lifecycle flow** (First Visit → Follow-up → Admission → Surgery → Discharge → Post-op Follow-up → Health Management) |
| 💬 Live Chat | Multi-conversation handling + knowledge-base-driven smart assistant suggestions + quick replies |
| 📅 Appointments | Appointment list, status filtering, one-click confirmation, and new appointments |
| 🎫 Service Tickets | Ticket tracking, priority, claim / process / resolve, and new tickets |
| 📚 Knowledge Base | **Internal knowledge base** (standard scripts) + **External knowledge base** (import authoritative external sources such as the National Health Commission, Chinese Medical Association, WHO; can be converted into internal scripts) |

## 🚀 Quick Start

```bash
# Option 1: simply double-click index.html

# Option 2: serve it with a local static server
python -m http.server 8765
# Then open http://localhost:8765/index.html in your browser
```

## 🗂️ Project Structure

```
.
├── index.html   # Page skeleton (sidebar + main area)
├── styles.css   # Eye-care themed styles (teal palette)
├── data.js      # Mock data (customers / appointments / tickets / knowledge base / lifecycle)
├── app.js       # All interaction logic + the customer-service chatbot
├── PRD.md       # Product Requirements Document
└── 庆春眼科客服平台-PRD.docx  # Word version of the PRD
```

## 🛠️ Tech Stack

Vanilla HTML / CSS / JavaScript — zero dependencies, zero build steps.

## 📄 Documentation

See [`PRD.md`](./PRD.md) for the full Product Requirements Document.
