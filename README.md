# Next.js Flowbite Starter

A clean, production-ready starter built with Next.js 14 Pages Router, React 18, TypeScript, Tailwind CSS, and Flowbite React.

The app intentionally includes only a polished `Hello World` page at `/` while keeping common UI, workflow, form, charting, PDF, QR, and API helper dependencies available for future development.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) in your browser.

## Scripts

```bash
npm run dev    # Start Next.js on port 3005
npm run build  # Build the production app
npm run start  # Start the production server on port 3005
npm run lint   # Run Next.js lint checks
```

## Docker

Build the image:

```bash
docker build -t next-flowbite-starter .
```

Run the container:

```bash
docker run --rm -p 3005:3005 next-flowbite-starter
```
