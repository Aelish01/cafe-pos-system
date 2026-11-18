# Cafe POS and Billing System: Implementation Review

This review examines the implementation of a full-stack Cafe POS system built with Angular 22 (frontend) and Node.js/Express/MongoDB (backend), featuring JWT authentication with role-based access control for Admin and Seller roles.

The system provides a single login page that redirects based on role: admins access dashboard, menu management, sales reports, and user management; sellers access a billing screen where they create bills and view only today's transactions (IST timezone). The implementation correctly captures menu item snapshots in bills, validates availability, and enforces role-based route protection.

**Watch for:** Admin guard JWT decode lacks token expiration verification (likely), unused TodayBills component registered but not routed (confirmed), login checks isActive but 403 returns 'Account deactivated' message that frontend doesn't distinguish from 'Invalid credentials' (confirmed), build output confirms compilation success.

**Verdict**: NEEDS_CHANGES

## High-level view

Backend authentication correctly implements bcrypt password verification and JWT signing with 8-hour expiration, but login returns generic 'Invalid credentials' for both wrong password and inactive accounts, making the 403 status code unused. Bill creation validates menu items, checks availability, and snapshots price/name at bill time to preserve historical accuracy. IST timezone calculation in getTodayBills computes UTC offsets correctly for midnight-to-midnight boundary queries. Menu and user CRUD operations implement proper validation (price > 0, password >= 6 chars, role enum checks) with bcrypt hashing for password operations.

Frontend services target the correct API base URL (http://https://cafe-pos-system-9ptq.onrender.com/api) and use proper HTTP methods. The token interceptor correctly adds Bearer authorization headers. Auth guard checks token presence but doesn't verify expiration; admin guard decodes JWT payload from localStorage token and checks role, falling back to /pos/billing for non-admins or /login on decode failure, but doesn't verify signature or expiration. Routes wire all components correctly with cascading guards (auth + admin for admin routes, auth-only for pos routes). Components use reactive forms with validators, call services correctly, and display errors via MatSnackBar.

Billing screen implements cart logic with add/remove/update quantity operations, generates bills by mapping cart items to menuItemId + quantity payloads, and includes a tabbed view showing today's bills fetched from the server. Print logic opens a new window with formatted receipt HTML and triggers window.print(). The TodayBills component exists in the codebase but is not imported or routed anywhere; billing screen's second tab already provides this functionality for sellers.

Build artifacts exist in dist/frontend/browser with recent timestamps (Nov 18, 10:50 AM), confirming successful compilation. Component class names in route configuration (Login, Dashboard, MenuManagement, etc.) match exported class names in implementation files.

<details>
<summary>Issues (4)</summary>

1. **Admin guard JWT decode bypasses verification** — adminGuard decodes the JWT payload with atob(token.split('.')[1]) to check role but never verifies signature or expiration. An attacker can craft a fake token with role: 'admin' and bypass admin routes. Add proper jwt.verify() or check token expiration from payload.exp field against Date.now().

2. **Inactive account returns misleading error** — authController login checks isActive: true in the findOne query, so inactive accounts return 400 'Invalid credentials' instead of 403 'Account deactivated'. The frontend cannot distinguish these cases. Move isActive check after bcrypt.compare() and return 403 with specific message if !user.isActive.

3. **Auth guard doesn't verify token expiration** — authGuard only checks localStorage token existence, allowing expired tokens to pass. Backend will reject expired tokens with 403, but the user will see API errors instead of being redirected to login. Decode token and check exp field, or rely on a 401/403 interceptor to catch expired tokens and redirect.

4. **Unused TodayBills component** — The TodayBills component exists at frontend/src/app/features/pos/today-bills but is not imported in app.routes.ts or used anywhere. The billing screen already implements today's bills in a tab. Either delete the unused component or clarify its intended purpose.

</details>

<details>
<summary>Details</summary>

## Backend authentication and password security

The authController login function queries User.findOne with both username and isActive: true in a single query. This means inactive accounts are treated identically to non-existent users, both returning 400 'Invalid credentials'. The code comment in the plan suggests returning 403 'Account deactivated' for inactive users, but the current implementation never reaches that case because the query filters them out.

## Bill creation and IST timezone calculation

The createBill controller iterates over req.body.items, validates each menuItemId exists and is available, snapshots name and price from the MenuItem document, calculates itemTotal, and builds a billItems array. This correctly preserves historical pricing: if a menu item's price changes after a bill is created, the bill retains the original price. The createdBy and createdByName fields come from req.user (populated by authMiddleware).

The getTodayBills controller computes IST midnight by:
1. Getting current UTC time + 5.5 hours to derive IST now
2. Extracting the date string (YYYY-MM-DD) from the ISO string
3. Constructing startUTC as midnight in that date minus the IST offset
4. Constructing endUTC as 23:59:59.999 in that date minus the IST offset
5. Querying createdAt: { $gte: startUTC, $lte: endUTC }

This correctly queries for bills created during the IST day regardless of the server's local timezone (confirmed by manual trace).

## Menu and user CRUD validation

The toggleUserStatus controller flips user.isActive without checking current role or preventing self-deactivation. An admin could deactivate themselves.

## Frontend services and API integration

The tokenInterceptor reads token from localStorage and clones the request to add headers: { Authorization: `Bearer ${token}` }. This matches the backend's expected format (authMiddleware splits 'Bearer ' from the header).

## Guard implementation and JWT handling

The authGuard checks localStorage.getItem('token') and returns true if present. It does not decode the token or check expiration. If a user's token expires, they will pass the guard but receive 403 errors from the backend on API calls.

The adminGuard decodes the JWT payload with JSON.parse(atob(token.split('.')[1])), checks payload.role === 'admin', and returns true or navigates to /pos/billing. This decode operation does not verify the JWT signature or check the exp field. A user could manually edit localStorage to inject a token with role: 'admin' and bypass admin routes.

## Route configuration and component wiring

The TodayBills component is defined at features/pos/today-bills/today-bills.ts but is not imported anywhere. The billing screen already implements today's bills in a mat-tab-group with two tabs: 'Billing' and 'Today's Bills'. The second tab displays todayBills from the component's todayBills property, populated by loadTodayBills() which calls billService.getTodayBills(). This makes the standalone TodayBills component redundant.

## Billing screen cart and print logic

The printBill method constructs an HTML string with inline styles (monospace font, table layout, dashed dividers, centered cafe name), opens a new window, writes the HTML, and calls printWindow.print(). This does not save the bill to the backend; it only prints the current cart. To persist and print, the user must call generateBill first, then manually trigger a print from the Today's Bills tab or the browser.



</details>

<details>
<summary>File map</summary>

**Backend**

- server.js — Express app with CORS, route mounting, global error handler
- controllers/authController.js — login with bcrypt compare, JWT sign
- controllers/billController.js — createBill (item snapshot), getAllBills, getTodayBills (IST range)
- controllers/menuController.js — menu CRUD with price validation
- controllers/userController.js — user CRUD with bcrypt hashing, toggleUserStatus
- routes/authRoutes.js — POST /login (no auth)
- routes/billRoutes.js — POST / (auth), GET / (auth+admin), GET /today (auth)
- routes/menuRoutes.js — GET / (auth), POST / (auth+admin), PUT /:id (auth+admin), DELETE /:id (auth+admin)
- routes/userRoutes.js — GET / (auth+admin), POST / (auth+admin), PUT /:id (auth+admin), PUT /:id/reset-password (auth+admin), PUT /:id/toggle-status (auth+admin)
- middleware/authMiddleware.js — JWT verify, req.user attachment
- middleware/adminMiddleware.js — role === 'admin' check
- models/User.js — username, password, name, role, isActive
- models/MenuItem.js — name, category, price, available
- models/Bill.js — items with snapshot, totalAmount, createdBy, createdAt

**Frontend**

- app.config.ts — provideHttpClient with interceptors, provideAnimations, provideRouter
- app.routes.ts — /login, /admin (guarded), /pos (guarded)
- core/interceptors/token-interceptor.ts — adds Authorization Bearer header
- core/guards/auth-guard.ts — checks token presence
- core/guards/admin-guard.ts — decodes JWT and checks role
- core/services/auth.ts — login, logout, getUser, isAdmin
- core/services/bill.ts — createBill, getAllBills, getTodayBills
- core/services/menu.ts — menu CRUD
- core/services/user.ts — user CRUD, resetPassword, toggleStatus
- features/auth/login/login.ts — reactive form, role-based redirect
- features/admin/dashboard/dashboard.ts — today's sales summary
- features/admin/menu-management/menu-management.ts — table, dialog for add/edit, delete
- features/admin/sales-report/sales-report.ts — date filter, bills table with expansion
- features/admin/user-management/user-management.ts — table, user dialog, reset password dialog
- features/pos/billing-screen/billing-screen.ts — cart, bill generation, print logic, today's bills tab
- features/pos/today-bills/today-bills.ts — empty stub component (unused)

Full diff: Review was based on reading implementation files directly; no git diff was provided.

</details>
