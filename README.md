# Global Backbone Monitor

A real-time dashboard to monitor the status of major internet infrastructure providers like Cloudflare, AWS, Google Cloud, and Azure.

**Live Demo:** [https://backbone-monitor.vercel.app/](https://backbone-monitor.vercel.app/)

## Features

* **Live Status Monitoring:** Visual indicators for Online, Degraded, or Down statuses.
* **Regional Breakdown:** Check specific status for US, Europe, and Asia regions.
* **Event Logs:** Real-time activity feed with filtering options (Critical, Warning, Info).
* **Export Data:** Download system logs as CSV or JSON files.
* **Responsive Design:** Fully responsive dark-mode UI built with Tailwind CSS.

## Tech Stack

* **Framework:** React + Vite
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Deployment:** Vercel

## Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/duhanens/backbone-monitor.git](https://github.com/duhanens/backbone-monitor.git)
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Note

This project is a frontend simulation designed for demonstration purposes. Due to browser security policies (CORS), it does not ping the actual servers in real-time but simulates realistic network behavior and latency.

## License

MIT License.
