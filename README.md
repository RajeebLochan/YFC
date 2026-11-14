# YFC Delivery

<p align="center">
  <img src="./public/product-overview.png" width="320" alt="A selection of freshly prepared Indian dishes and coffee ready for delivery">
</p>

<p align="center"><em>Browse a menu, build an order, and get fresh food delivered.</em></p>

YFC Delivery is a responsive food-ordering web app for customers who want a quick, simple way to find dishes, add them to a cart, and place a cash-on-delivery order. Restaurant teams get a separate dashboard to manage menus, orders, and basic sales activity.

## What the product does

| Customer experience | Restaurant operations |
| --- | --- |
| Browse dishes across restaurants | Manage restaurants, menu items, and orders |
| Search by dish, category, or restaurant | Review order status and delivery details |
| Filter vegetarian and non-vegetarian options | View sales and rating analytics |
| Place a cash-on-delivery order | Use a password-protected admin dashboard |
| Track an order using its mobile number | Keep operational data in local SQLite storage |

## Built with privacy in mind

- No contact number, WhatsApp link, support email, or fixed location is displayed in the product UI.
- No EmailJS keys or email-notification service is included in the project.
- Admin access has no hard-coded default credentials. Create an initial admin only by setting environment variables.
- Customer phone and address fields are collected only for placing and tracking delivery orders.

## Technology

- React 19 and React Router
- Tailwind CSS, Material UI, and Framer Motion
- Express 5 API server
- SQLite database via `sqlite3`

## Run locally

Prerequisite: Node.js 18 or later.

```bash
npm ci
npm run dev
```

The app starts both services:

- Web app: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:5000](http://localhost:5000)

To create an optimized production build:

```bash
npm run build
```

## Configuration

The server works without a configuration file for customer ordering. To bootstrap an admin account in a fresh database, set both variables before starting the server:

```powershell
$env:ADMIN_USERNAME = "your-admin-username"
$env:ADMIN_PASSWORD = "use-a-strong-password"
npm run server
```

Optional variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `5000` |
| `REACT_APP_API_URL` | Public API base URL for a deployed frontend |
| `ADMIN_USERNAME` | Username for initial admin bootstrap |
| `ADMIN_PASSWORD` | Password for initial admin bootstrap |

## Project structure

```text
src/                 React pages, UI components, and client services
server/index.js      Express API and SQLite initialization
public/              Static assets, including the README product image
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run frontend and API together |
| `npm start` | Run the React development server |
| `npm run server` | Run the Express API server |
| `npm run build` | Create a production frontend build |
| `npm test` | Run the React test suite |
