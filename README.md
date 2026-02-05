# Next.js + Bun Application

A minimal **Next.js App Router** project configured to use **Bun** as the runtime and package manager.

---

## Prerequisites

Ensure **Bun** is installed on your system:

```bash
bun --version
```

If Bun is not installed -

```bash
curl -fsSL https://bun.sh/install | bash
```

---

## Installation

Install project dependencies:

```bash
bun install
```

---

## Run the Application

Start the development server:

```bash
bun dev
```

Open the application in your browser:

```text
http://localhost:3000
```

---

## Project Structure (Brief)

```text
.
├── app/            # App Router pages and layouts
├── components/     # Reusable UI components
├── public/         # Static assets
├── bun.lockb       # Bun lock file
├── package.json    # Project scripts and dependencies
└── README.md       # Project documentation
```

---

## Notes

* Uses **Next.js App Router**
* Uses **Bun** for faster installs and startup
* Tailwind CSS is used for styling
