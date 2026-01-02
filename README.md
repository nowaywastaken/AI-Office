# 🚀 AI Office Suite

<div align="center">

**Generate professional Word, Excel, and PowerPoint documents from natural language**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-cyan.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔤 **Word Generation** | Full formatting control: fonts, sizes, margins, line spacing, colors |
| 📊 **Excel Generation** | Cells, formulas, charts, borders, auto-fit columns |
| 📽 **PPT Generation** | Slides, shapes, text boxes, images, tables |
| 🤖 **AI-Powered** | Natural language to structured documents via OpenAI |
| 🎨 **Style Parsing** | Extracts formatting from prompts ("12pt Arial, 1.5 line spacing") |
| 🌐 **Modern UI** | Glassmorphism design with real-time chat interface |

---

## 📁 Project Structure

```
ai-office-suite/
├── server/                    # Python Backend
│   ├── api/
│   │   ├── models.py          # Pydantic request/response models
│   │   └── routes.py          # API endpoints
│   ├── core/
│   │   ├── engine_word.py     # Word document engine
│   │   ├── engine_excel.py    # Excel workbook engine
│   │   ├── engine_ppt.py      # PowerPoint engine
│   │   └── llm.py             # AI content generation service
│   ├── main.py                # FastAPI entry point
│   └── requirements.txt       # Python dependencies
│
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   └── DocumentPreview.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API Key (optional, for AI features)

### 1️⃣ Backend Setup

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set API key (optional)
export OPENAI_API_KEY="your-api-key"  # Windows: set OPENAI_API_KEY=...

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2️⃣ Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3️⃣ Open in Browser

Navigate to `http://localhost:5173`

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/api/status` | Engine status + AI availability |
| `POST` | `/api/generate` | Generate document |
| `GET` | `/api/download/{filename}` | Download generated file |

### Generate Document

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "word",
    "title": "Project Proposal",
    "content": "Create a project proposal with 12pt Times New Roman, 1.5 line spacing"
  }'
```

**Response:**
```json
{
  "file_url": "/api/download/abc123.docx",
  "message": "Successfully generated WORD document: Project Proposal"
}
```

---

## 🎨 Supported Formatting

### Word Documents

| Feature | Example |
|---------|---------|
| Fonts | Arial, Times New Roman, 微软雅黑, 宋体 |
| Font Size | Any size (e.g., 10.5pt, 12pt, 14pt) |
| Line Spacing | Single, 1.5, Double, or custom (1.15, 1.25) |
| Margins | Custom margins in cm or inches |
| Colors | Any hex color (#FF0000) |
| Alignment | Left, Center, Right, Justify |
| Headings | Levels 1-6 |
| Tables | With borders and custom widths |
| Images | PNG, JPG with custom sizes |

### Excel Workbooks

| Feature | Example |
|---------|---------|
| Cell Formatting | Fonts, colors, backgrounds |
| Formulas | SUM, AVERAGE, custom formulas |
| Charts | Bar, Pie, Line |
| Borders | Thin, Medium, Thick |
| Column Sizing | Auto-fit or custom width |

### PowerPoint Presentations

| Feature | Example |
|---------|---------|
| Slide Layouts | Title, Content, Blank |
| Text Boxes | Custom position and size |
| Shapes | Rectangle, Oval, Triangle |
| Images | Custom position and size |
| Tables | With styling |

---

## 🤖 AI Features

When an OpenAI API key is configured, the system can:

1. **Parse Style from Natural Language**
   - "Create a report with 12pt Arial font and 1.5 line spacing"
   - "Make a spreadsheet showing quarterly sales data"
   - "Design a 10-slide presentation about AI"

2. **Generate Structured Content**
   - Word: Sections with headings and paragraphs
   - Excel: Headers, data rows, formulas
   - PPT: Multiple slides with bullet points

3. **Fallback Mode**
   - Works without API key using mock content
   - Still applies style parsing from prompts

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | None |
| `LLM_API_KEY` | Alternative API key env var | None |
| `LLM_MODEL` | Model to use | `gpt-4o-mini` |

---

## 📝 Examples

### Create a Formal Report

```
Create a project status report with:
- 12pt Times New Roman font
- 1.5 line spacing
- 2cm margins
- Sections: Executive Summary, Progress, Challenges, Next Steps
```

### Create a Financial Spreadsheet

```
Create a quarterly budget spreadsheet with:
- Columns: Category, Q1, Q2, Q3, Q4, Total
- Categories: Revenue, Expenses, Marketing, Operations
- Auto-sum formulas for totals
```

### Create a Presentation

```
Create a product launch presentation with:
- 10 slides
- Title slide with company name
- Product features, benefits, pricing, timeline
- Call to action
```

---

## 🛠 Development

### Running Tests

```bash
cd server
pytest
```

### Building for Production

```bash
# Frontend
cd client
npm run build

# Serve with any static server or integrate with backend
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ using FastAPI, React, and AI**

</div>
