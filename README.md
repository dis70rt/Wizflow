# 🔌 Workflow Execution Engine (Nutanix - PS.5)

Wizflow is designed to **capture workflow input via JSON** and **execute defined steps** such as:

- Shell Script Execution
- REST API Calls

### Example JSON Workflow

```json
{
    "workflow_name": "shell_workflow",
    "description": "A pure shell command workflow example",
    "version": "1.0",
    "tasks": [
      {
        "id": "gen_file",
        "name": "Generate Data File",
        "type": "SHELL",
        "command": "echo 'sample data line 1\nsample data line 2\nsample data line 3' > workspace/data.txt",
        "outputs": {
          "data_file": {
            "type": "file",
            "path": "workspace/data.txt"
          }
        },
        "depends_on": ["init"],
        "status": "PENDING"
      },
      {
        "id": "count_lines",
        "name": "Count Lines in Data File",
        "type": "SHELL",
        "command": "wc -l {{data_file}} | awk '{print $1}' > workspace/line_count.txt",
        "input_mappings": {
          "data_file": {
            "from_task": "gen_file",
            "output": "data_file"
          }
        },
        "outputs": {
          "line_count": {
            "type": "file",
            "path": "workspace/line_count.txt"
          }
        },
        "depends_on": ["gen_file"],
        "status": "PENDING"
      },
    ]
  }
  
```

The frontend sends this payload to the backend (see [Backend Repo](https://github.com/Hemant2A2/Wizflow)) for execution. Logs and statuses can be tracked via the UI.

# 🚀 Wizflow Frontend – Nutanix Hackathon 2025 Submission

Welcome to the **frontend** of **Wizflow**, our submission for the **Nutanix Hackathon 2025**. This application is built using **React**, **Vite**, **TypeScript**, and **TailwindCSS**, and enables intuitive workflow creation and execution.

> 🔗 **[Backend Repository](https://github.com/Hemant2A2/Wizflow)**  
> Please refer to the backend repo for details on workflow execution logic and API services.

---

## 📌 Features

- ⚡ Fast, modern UI built with Vite and React
- 🧩 Drag-and-drop workflows using `reactflow`
- 🔁 Workflow input via JSON payloads
- 🖥️ Supports Shell Script, REST API task types, EMAIL Tasks
- 🌐 Extensible to support more task types in future
- Parallel Computing & Multi-thread task processing
- 🔔 Toast notifications via `sonner`
- 🔒 Firebase-ready for auth, backend support and Database Management
- 🧠 Lightweight, fully customizable

---

## 📦 Tech Stack

| Type             | Package                       | Purpose                             |
|------------------|-------------------------------|-------------------------------------|
| Framework        | `react`, `react-dom`          | UI rendering                        |
| Build Tool       | `vite`                        | Lightning-fast build system         |
| Styling          | `tailwindcss`, `autoprefixer`, `postcss` | Utility-first styling           |
| Workflow UI      | `reactflow`                   | Drag-and-drop workflow builder      |
| Notifications    | `sonner`                      | Toast notifications                 |
| Utility          | `uuid`, `@types/uuid`         | Unique node/task IDs                |
| Firebase         | `firebase`                    | Auth & backend services (optional)  |
| Icons            | `lucide-react`                | Modern, customizable icon pack      |
| Linting/Dev      | `eslint`, `typescript`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@vitejs/plugin-react` | Clean code & Dev tools |

---

## 📁 Project Structure

```bash
vite-react-typescript-starter/
├── public/             # Static assets
├── src/                # Source code
│   ├── components/     # Reusable components
│   ├── pages/          # Main pages/views
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   └── main.tsx        # App entry point
├── tailwind.config.js  # Tailwind config
├── tsconfig.json       # TypeScript config
├── package.json        # Project dependencies
└── vite.config.ts      # Vite config
```

---

## 🚀 Getting Started

### ✅ Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### 🔧 Installation

```bash
# Clone the repository
https://github.com/dis70rt/Wizflow.git
cd Wizflow

# Install dependencies
npm install
# or
yarn install
```

### 📱 Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the app.

### 🛠️ Build for Production

```bash
npm run build
# or
yarn build
```

### 🔍 Preview Production Build

```bash
npm run preview
# or
yarn preview
```
---



---

## 📈 Future Extensibility

We’ve architected this with extensibility in mind:

- Add new task types (e.g., database ops, file transfer)
- Integrate third-party APIs
- Enhance user authentication via Firebase
- Workflow validation, branching, retries

---

## 🤝 Contributing

Contributions, feedback, and ideas are welcome! Open an issue or PR anytime.

---

## 📄 License

MIT License

---

### ✨ Built with ❤️ by Team Wizflow for Nutanix Hackathon 2025


---

Let me know if you'd like a badge section, images/gifs, or contribution guidelines added!
