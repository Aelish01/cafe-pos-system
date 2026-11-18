# Implementation Plan: Cafe POS and Billing System

This plan implements a full-stack Cafe POS system with Angular 22 (frontend) and Node.js/Express/MongoDB (backend), featuring JWT authentication with role-based access control (Admin & Seller).

## Backend Implementation (/Users/rahul/Aelish/cafe/cafe-pos-system/backend)

### Phase 1: Environment & Database Setup

- [ ] 1. Configure environment variables in .env file.
      Add JWT_SECRET (random 64-char string), MONGODB_URI (mongodb://localhost:27017/cafe-pos), and PORT (5000). Do NOT overwrite the file if it already has content — only append missing values.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/.env
      Verify: `cat backend/.env` confirms all three variables exist.

- [ ] 2. Create database connection module.
      Implement connectDB() function using mongoose.connect() with MONGODB_URI from process.env, proper error handling, and connection success logging.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/config/db.js
      Verify: `node -e "require('./backend/config/db'); console.log('Loaded');"` runs without syntax errors.

### Phase 2: Mongoose Models

- [ ] 3. Create User model with schema and methods.
      Schema: username (unique, required, string), password (required, string), name (required, string), role (enum: ['admin', 'seller'], default: 'seller'), isActive (boolean, default: true), createdAt (Date, default: Date.now). Export mongoose model as 'User'.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/models/User.js
      Verify: `node -e "const User = require('./backend/models/User'); console.log(User.modelName);"` prints 'User'.

- [ ] 4. Create MenuItem model with schema.
      Schema: name (required, string), category (required, string), price (required, number, min: 0), available (boolean, default: true), createdAt (Date, default: Date.now). Export mongoose model as 'MenuItem'.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/models/MenuItem.js
      Verify: `node -e "const MenuItem = require('./backend/models/MenuItem'); console.log(MenuItem.modelName);"` prints 'MenuItem'.

- [ ] 5. Create Bill model with schema.
      Schema: items (array of objects with menuItemId (ObjectId, ref: 'MenuItem'), name (string), price (number), quantity (number)), totalAmount (required, number), createdBy (ObjectId, ref: 'User', required), createdByName (string), createdAt (Date, default: Date.now, indexed for query performance). Export mongoose model as 'Bill'.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/models/Bill.js
      Verify: `node -e "const Bill = require('./backend/models/Bill'); console.log(Bill.modelName);"` prints 'Bill'.

### Phase 3: Authentication Middleware

- [ ] 6. Create JWT authentication middleware.
      Implement authMiddleware function that: extracts token from Authorization header (Bearer format), verifies with jwt.verify using JWT_SECRET, attaches decoded user object to req.user, returns 401 if no token or 403 if invalid/expired. Export as module.exports.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/middleware/authMiddleware.js
      Verify: `node -e "const auth = require('./backend/middleware/authMiddleware'); console.log(typeof auth);"` prints 'function'.

### Phase 4: Controllers

- [ ] 7. Create authentication controller with login endpoint.
      Implement login(req, res) function: extract username and password from req.body, find user by username with User.findOne(), check isActive status, verify password with bcrypt.compare(), generate JWT with jwt.sign() containing {id: user._id, username, role, name} and 24h expiration, return {token, user: {id, username, role, name}} on success, return 400 'Invalid credentials' on failure, return 403 'Account deactivated' if !isActive.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/controllers/authController.js
      Verify: `node -e "const {login} = require('./backend/controllers/authController'); console.log(typeof login);"` prints 'function'.

- [ ] 8. Create bill controller with CRUD operations.
      Implement three async functions: (1) createBill(req, res) - create new Bill from req.body with createdBy from req.user.id, createdByName from req.user.name, return 201 with created bill; (2) getAllBills(req, res) - find all bills sorted by createdAt descending, populate createdBy user info (name only), return 200 with bills array; (3) getTodayBills(req, res) - compute today start/end in IST timezone (UTC+5:30) using Date operations (today 00:00:00 IST to 23:59:59 IST), query bills with createdAt: {$gte: startIST, $lte: endIST}, populate createdBy, return 200 with bills array. Export all three functions.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/controllers/billController.js
      Verify: `node -e "const {createBill, getAllBills, getTodayBills} = require('./backend/controllers/billController'); console.log(typeof createBill, typeof getAllBills, typeof getTodayBills);"` prints 'function function function'.

- [ ] 9. Create menu controller with CRUD operations.
      Implement four async functions: (1) getAllMenuItems(req, res) - find all menu items sorted by category then name, return 200 with items; (2) createMenuItem(req, res) - create MenuItem from req.body, return 201 with created item; (3) updateMenuItem(req, res) - find by req.params.id and update with req.body using {new: true, runValidators: true}, return 200 with updated item or 404 if not found; (4) deleteMenuItem(req, res) - find by req.params.id and delete, return 200 with success message or 404 if not found. Export all four functions.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/controllers/menuController.js
      Verify: `node -e "const {getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem} = require('./backend/controllers/menuController'); console.log(typeof getAllMenuItems);"` prints 'function'.

- [ ] 10. Create user controller with CRUD operations.
      Implement five async functions: (1) getAllUsers(req, res) - find all users, select all fields except password, return 200 with users; (2) createUser(req, res) - hash password with bcrypt.hash(req.body.password, 10), create User with hashed password, return 201 with user object (exclude password); (3) updateUser(req, res) - find by req.params.id, update name/username/role fields only (never password here), return 200 with updated user or 404; (4) resetPassword(req, res) - find by req.params.id, hash req.body.password with bcrypt, update user.password, save, return 200 'Password reset successful' or 404; (5) toggleUserStatus(req, res) - find by req.params.id, toggle user.isActive boolean, save, return 200 with updated user or 404. Export all five functions.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/controllers/userController.js
      Verify: `node -e "const {getAllUsers, createUser, updateUser, resetPassword, toggleUserStatus} = require('./backend/controllers/userController'); console.log(typeof getAllUsers);"` prints 'function'.

### Phase 5: Routes Configuration

- [ ] 11. Wire authentication routes to controller.
      Create Express router, define POST /login route calling authController.login (no auth middleware), export router as module.exports.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/routes/authRoutes.js
      Verify: `node -e "const router = require('./backend/routes/authRoutes'); console.log(router.stack.length > 0);"` prints 'true'.

- [ ] 12. Wire bill routes to controller with authentication.
      Create Express router, import authMiddleware, define three routes all protected by authMiddleware: POST / → billController.createBill, GET / → billController.getAllBills, GET /today → billController.getTodayBills. Export router.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/routes/billRoutes.js
      Verify: `node -e "const router = require('./backend/routes/billRoutes'); console.log(router.stack.length >= 3);"` prints 'true'.

- [ ] 13. Wire menu routes to controller with authentication.
      Create Express router, import authMiddleware, define four routes all protected: GET / → menuController.getAllMenuItems, POST / → menuController.createMenuItem, PUT /:id → menuController.updateMenuItem, DELETE /:id → menuController.deleteMenuItem. Export router.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/routes/menuRoutes.js
      Verify: `node -e "const router = require('./backend/routes/menuRoutes'); console.log(router.stack.length >= 4);"` prints 'true'.

- [ ] 14. Wire user routes to controller with authentication.
      Create Express router, import authMiddleware, define five routes all protected: GET / → userController.getAllUsers, POST / → userController.createUser, PUT /:id → userController.updateUser, PUT /:id/reset-password → userController.resetPassword, PUT /:id/toggle-status → userController.toggleUserStatus. Export router.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/routes/userRoutes.js
      Verify: `node -e "const router = require('./backend/routes/userRoutes'); console.log(router.stack.length >= 5);"` prints 'true'.

### Phase 6: Server Setup

- [ ] 15. Create Express server with all routes and middleware.
      Import required modules (express, cors, dotenv, connectDB, all route files). Call dotenv.config(). Create Express app. Configure CORS with origin 'http://localhost:4200'. Add express.json() middleware. Connect database with connectDB(). Mount routes: /api/auth → authRoutes, /api/bills → billRoutes, /api/menu → menuRoutes, /api/users → userRoutes. Add global error handler middleware. Start server on PORT from env or 5000. Add npm script "dev": "nodemon server.js" to package.json.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/server.js, /Users/rahul/Aelish/cafe/cafe-pos-system/backend/package.json
      Verify: `node backend/server.js &` starts server without errors, logs 'Server running' and 'MongoDB Connected', then kill the process.

## Frontend Implementation (/Users/rahul/Aelish/cafe/cafe-pos-system/frontend)

### Phase 7: Core Configuration

- [ ] 16. Configure Angular application providers.
      Import provideHttpClient, withInterceptors, provideAnimations, provideRouter. Update appConfig.providers array to include: provideHttpClient(withInterceptors([tokenInterceptor])), provideAnimations(), provideRouter(routes). Keep existing provideBrowserGlobalErrorListeners and provideClientHydration.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/app.config.ts
      Verify: `npm run build --configuration development` in frontend directory completes without errors.

- [ ] 17. Create Angular environment configuration file.
      Create environment.ts file exporting const environment = {production: false, apiUrl: 'http://localhost:5000/api'}. Create environment.prod.ts with production: true and same apiUrl (update later for production).
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/environments/environment.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/environments/environment.prod.ts
      Verify: `cat frontend/src/environments/environment.ts` shows apiUrl configuration.

### Phase 8: HTTP Interceptor & Guards

- [ ] 18. Implement JWT token interceptor.
      Import HttpInterceptorFn. Implement tokenInterceptor: read token from localStorage.getItem('token'), if token exists clone request and add Authorization header with 'Bearer ' + token, pass cloned request to next(), otherwise pass original request. Return next(req) result.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/core/interceptors/token-interceptor.ts
      Verify: `npm run build --configuration development` completes without errors.

- [ ] 19. Implement authentication guard.
      Import inject, Router, CanActivateFn. Implement authGuard: inject Router, check if localStorage.getItem('token') exists, if yes return true, else navigate to '/login' and return false.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/core/guards/auth-guard.ts
      Verify: `npm run build --configuration development` completes without errors.

- [ ] 20. Implement admin role guard.
      Import inject, Router, CanActivateFn. Implement adminGuard: inject Router, read user from localStorage.getItem('user'), parse JSON, check if user.role === 'admin', if yes return true, else navigate to '/pos/billing' and return false. Handle null/invalid JSON gracefully by returning false and navigating to login.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/core/guards/admin-guard.ts
      Verify: `npm run build --configuration development` completes without errors.

### Phase 9: Core Services

- [ ] 21. Implement AuthService with login/logout/utility methods.
      Replace @Service() with @Injectable({providedIn: 'root'}). Inject HttpClient and Router. Implement methods: (1) login(username: string, password: string): Observable<any> - POST to ${environment.apiUrl}/auth/login with {username, password}, tap response to store token and user in localStorage; (2) logout() - remove token and user from localStorage, navigate to /login; (3) getToken(): string | null - return localStorage token; (4) getUser() - parse and return user from localStorage; (5) isLoggedIn(): boolean - check if token exists; (6) isAdmin(): boolean - check if user.role === 'admin'. Add proper RxJS imports (Observable, tap) and error handling.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/core/services/auth.ts
      Verify: `npm run build --configuration development` completes without errors.

- [ ] 22. Implement BillService with bill operations.
      Replace @Service() with @Injectable({providedIn: 'root'}). Inject HttpClient. Define Bill interface with items array (menuItemId, name, price, quantity), totalAmount, createdBy, createdByName, createdAt. Implement methods: (1) createBill(bill: any): Observable<Bill> - POST to ${environment.apiUrl}/bills; (2) getAllBills(params?: any): Observable<Bill[]> - GET to ${environment.apiUrl}/bills with optional query params; (3) getTodayBills(): Observable<Bill[]> - GET to ${environment.apiUrl}/bills/today. Return typed Observables.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/core/services/bill.ts
      Verify: `npm run build --configuration development` completes without errors.

- [ ] 23. Implement MenuService with menu CRUD operations.
      Replace @Service() with @Injectable({providedIn: 'root'}). Inject HttpClient. Define MenuItem interface with name, category, price, available, _id. Implement methods: (1) getAll(): Observable<MenuItem[]> - GET to ${environment.apiUrl}/menu; (2) create(item: Partial<MenuItem>): Observable<MenuItem> - POST to ${environment.apiUrl}/menu; (3) update(id: string, item: Partial<MenuItem>): Observable<MenuItem> - PUT to ${environment.apiUrl}/menu/${id}; (4) delete(id: string): Observable<any> - DELETE to ${environment.apiUrl}/menu/${id}. Return typed Observables.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/core/services/menu.ts
      Verify: `npm run build --configuration development` completes without errors.

- [ ] 24. Implement UserService with user CRUD operations.
      Replace @Service() with @Injectable({providedIn: 'root'}). Inject HttpClient. Define User interface with _id, username, name, role, isActive. Implement methods: (1) getAll(): Observable<User[]> - GET to ${environment.apiUrl}/users; (2) create(user: any): Observable<User> - POST to ${environment.apiUrl}/users; (3) update(id: string, user: any): Observable<User> - PUT to ${environment.apiUrl}/users/${id}; (4) resetPassword(id: string, password: string): Observable<any> - PUT to ${environment.apiUrl}/users/${id}/reset-password with {password}; (5) toggleStatus(id: string): Observable<User> - PUT to ${environment.apiUrl}/users/${id}/toggle-status. Return typed Observables.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/core/services/user.ts
      Verify: `npm run build --configuration development` completes without errors.

### Phase 10: Routing Configuration

- [ ] 25. Configure complete application routing.
      Import all components and guards. Define routes array: (1) {path: 'login', component: Login}; (2) {path: 'admin', canActivate: [authGuard, adminGuard], children: [{path: 'dashboard', component: Dashboard}, {path: 'menu', component: MenuManagement}, {path: 'sales', component: SalesReport}, {path: 'users', component: UserManagement}, {path: '', redirectTo: 'dashboard', pathMatch: 'full'}]}; (3) {path: 'pos', canActivate: [authGuard], children: [{path: 'billing', component: BillingScreen}, {path: '', redirectTo: 'billing', pathMatch: 'full'}]}; (4) {path: '', redirectTo: '/login', pathMatch: 'full'}; (5) {path: '**', redirectTo: '/login'}. Export as routes.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/app.routes.ts
      Verify: `npm run build --configuration development` completes without errors.

### Phase 11: Authentication Feature

- [ ] 26. Implement Login component with reactive form.
      Import ReactiveFormsModule, CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBar. Inject FormBuilder, AuthService, Router, MatSnackBar. Create reactive form with username and password FormControls (both required, username minLength 3, password minLength 4). Implement onSubmit(): call authService.login(), on success check user role and navigate to /admin/dashboard if admin or /pos/billing if seller, on error show MatSnackBar with error message. Add loading boolean to disable form during submission. Create template with mat-card containing form with mat-form-fields, mat-error for validation, and submit button (disabled when invalid or loading).
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/auth/login/login.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/auth/login/login.html, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/auth/login/login.scss
      Verify: `npm run build --configuration development` completes without errors.

### Phase 12: Admin Dashboard

- [ ] 27. Implement Admin Dashboard component with today's sales summary.
      Import CommonModule, MatCardModule, MatProgressSpinnerModule, BillService. Inject BillService. Create properties: todaySales: number = 0, billCount: number = 0, loading: boolean = true. In ngOnInit, call billService.getTodayBills(), calculate totalAmount sum and count, assign to properties, set loading false. Create template with two mat-cards side by side: one showing total sales (formatted as currency with ₹ symbol), one showing bill count. Show mat-spinner while loading.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/dashboard/dashboard.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/dashboard/dashboard.html, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/dashboard/dashboard.scss
      Verify: `npm run build --configuration development` completes without errors.

### Phase 13: Admin Sales Report

- [ ] 28. Implement Sales Report component with date filtering and bill table.
      Import ReactiveFormsModule, CommonModule, MatTableModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatExpansionModule, BillService. Inject FormBuilder, BillService. Create form with startDate and endDate controls. Create bills: any[] = [], displayedColumns: string[] = ['createdAt', 'createdByName', 'itemCount', 'totalAmount', 'actions']. Implement loadBills() to call billService.getAllBills(), filter by date range if set, assign to bills array. Call loadBills() in ngOnInit. Implement onFilter() on form submit to call loadBills(). Create template with mat-card containing date picker form, mat-table with columns (date formatted with DatePipe, created by name, item count, total as currency, expand button), mat-expansion-panel in each row showing item details (item name, quantity, price). Add filter and reset buttons.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/sales-report/sales-report.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/sales-report/sales-report.html, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/sales-report/sales-report.scss
      Verify: `npm run build --configuration development` completes without errors.

### Phase 14: Admin Menu Management

- [ ] 29. Implement Menu Management component with table and CRUD dialogs.
      Import CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatCardModule, ReactiveFormsModule, MatSnackBar, MenuService. Inject MenuService, MatDialog, MatSnackBar. Create menuItems: MenuItem[] = [], displayedColumns = ['name', 'category', 'price', 'available', 'actions']. Implement loadMenuItems() calling menuService.getAll(). Call in ngOnInit. Implement openDialog(item?: MenuItem) to open MatDialog with MenuDialogComponent passing item data, on close refresh list. Implement deleteItem(id) with confirm dialog, call menuService.delete(id), show snackbar, refresh. Create template with mat-card, Add button, mat-table with edit and delete icon buttons per row, available status shown with color coding. Create separate MenuDialogComponent with reactive form (name required, category required, price required min 0, available checkbox), inject MAT_DIALOG_DATA and MatDialogRef, implement save calling menuService.create or update based on data presence, close dialog on success.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/menu-management/menu-management.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/menu-management/menu-management.html, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/menu-management/menu-management.scss, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/menu-management/menu-dialog.component.ts
      Verify: `npm run build --configuration development` completes without errors.

### Phase 15: Admin User Management

- [ ] 30. Implement User Management component with table and CRUD dialogs.
      Import CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatCardModule, ReactiveFormsModule, MatSnackBar, UserService. Inject UserService, MatDialog, MatSnackBar. Create users: User[] = [], displayedColumns = ['username', 'name', 'role', 'isActive', 'actions']. Implement loadUsers() calling userService.getAll(). Call in ngOnInit. Implement openDialog(user?: User) to open UserDialogComponent, refresh on close. Implement toggleStatus(id) calling userService.toggleStatus(id), refresh. Implement openResetPasswordDialog(user) to open ResetPasswordDialogComponent passing user id. Implement deleteUser(id) with confirmation. Create template with mat-card, Add button, mat-table with edit/toggle status/reset password/delete actions. Create UserDialogComponent with form (username, name, password required only for new user, role select with admin/seller options), implement save. Create ResetPasswordDialogComponent with password field, implement save calling userService.resetPassword.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/user-management/user-management.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/user-management/user-management.html, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/user-management/user-management.scss, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/user-management/user-dialog.component.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/user-management/reset-password-dialog.component.ts
      Verify: `npm run build --configuration development` completes without errors.

### Phase 16: POS Billing Screen

- [ ] 31. Implement Billing Screen component with menu selection and cart.
      Import CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTableModule, MatTabsModule, ReactiveFormsModule, MenuService, BillService, AuthService, MatSnackBar. Inject all services. Create menuItems: MenuItem[] = [], categories: string[] = [], selectedCategory: string = 'All', cart: any[] = [], todayBills: any[] = [], selectedTab: number = 0. In ngOnInit load menu items with menuService.getAll(), extract unique categories, load today's bills if seller. Implement filterByCategory(category) to set selectedCategory. Computed filteredMenuItems filters by category and available=true. Implement addToCart(item) to push or increment quantity in cart array. Implement removeFromCart(index), updateQuantity(index, qty). Computed cartTotal sums item.price * item.quantity. Implement generateBill() to create bill object with items and totalAmount, call billService.createBill(), show success snackbar, clear cart. Implement printBill() to show print dialog with formatted receipt (cafe name, items table, total, date), call window.print() on the print-area div. Create two-column template: left side shows category mat-chips and menu mat-cards (name, price, add button), right side shows cart mat-table (item, qty with +/- buttons, price, remove), total, generate bill button, print button. Add mat-tab-group with Billing and Today's Bills tabs (second tab shows bills table).
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/pos/billing-screen/billing-screen.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/pos/billing-screen/billing-screen.html, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/pos/billing-screen/billing-screen.scss
      Verify: `npm run build --configuration development` completes without errors.

### Phase 17: Layouts

- [ ] 32. Create Admin Layout component with sidenav navigation.
      Create new component AdminLayoutComponent at /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/shared/layouts/admin-layout/admin-layout.component.ts. Import MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, CommonModule, RouterModule, AuthService. Inject Router, AuthService. Create navigation items array with Dashboard, Menu Management, Sales Report, Users (with routes and icons). Implement logout() calling authService.logout(). Create template with mat-sidenav-container: mat-sidenav with mat-nav-list (links with routerLink, routerLinkActive='active', logout button), mat-sidenav-content with mat-toolbar (title 'Cafe POS - Admin', spacer, user name, logout icon) and router-outlet for child routes. Add SCSS for layout styling and active link highlighting. Update admin route in app.routes.ts to use AdminLayoutComponent as wrapper with children nested inside.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/shared/layouts/admin-layout/admin-layout.component.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/shared/layouts/admin-layout/admin-layout.component.html, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/shared/layouts/admin-layout/admin-layout.component.scss, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/app.routes.ts
      Verify: `npm run build --configuration development` completes without errors.

- [ ] 33. Create Seller Layout component with simple toolbar.
      Create new component SellerLayoutComponent at /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/shared/layouts/seller-layout/seller-layout.component.ts. Import MatToolbarModule, MatButtonModule, CommonModule, RouterModule, AuthService. Inject Router, AuthService. Create template with mat-toolbar (title 'Cafe POS - Billing', spacer, user name from authService.getUser(), logout button) and router-outlet below. Add SCSS for toolbar styling. Update pos route in app.routes.ts to use SellerLayoutComponent as wrapper with children nested inside.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/shared/layouts/seller-layout/seller-layout.component.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/shared/layouts/seller-layout/seller-layout.component.html, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/shared/layouts/seller-layout/seller-layout.component.scss, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/app.routes.ts
      Verify: `npm run build --configuration development` completes without errors.

### Phase 18: Theming & Global Styles

- [ ] 34. Configure custom Material theme with warm cafe colors.
      In /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/styles.scss, after existing Material theme, define custom color variables: $cafe-brown: #6D4C41, $cafe-amber: #FFA726, $cafe-light: #FFCC80, $cafe-dark: #5D4037. Use @use '@angular/material' as mat and mat.define-palette() to create custom brown and amber palettes. Use mat.define-theme() or mat.theme() to apply custom primary (brown) and accent (amber) colors. Add global utility classes for spacing, flex layouts, and form styling. Override Material component colors for buttons, cards, toolbar using custom colors. Add print media query styles to hide navigation and show only .print-area content when printing bills.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/styles.scss
      Verify: `npm run build --configuration development` completes without errors.

### Phase 19: Loading & Error States

- [ ] 35. Add loading spinners and snackbar notifications across all components.
      Audit all components that call services (Dashboard, SalesReport, MenuManagement, UserManagement, BillingScreen, Login). Ensure each has: (1) loading: boolean property toggled around API calls; (2) mat-progress-spinner shown in template when loading is true; (3) MatSnackBar imported and injected; (4) success/error snackbars shown after create/update/delete operations with appropriate messages (e.g., 'Menu item added successfully', 'Failed to create bill', etc.) with 3000ms duration and 'Close' action. Add error property: string | null to display specific error messages in templates where appropriate. Import MatProgressSpinnerModule and MatSnackBarModule in all affected components.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/dashboard/dashboard.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/sales-report/sales-report.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/menu-management/menu-management.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/admin/user-management/user-management.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/pos/billing-screen/billing-screen.ts, /Users/rahul/Aelish/cafe/cafe-pos-system/frontend/src/app/features/auth/login/login.ts (and corresponding .html templates)
      Verify: `npm run build --configuration development` completes without errors.

## Integration & Testing

### Phase 20: Database Seeding & Testing

- [ ] 36. Create database seed script with sample data.
      Create /Users/rahul/Aelish/cafe/cafe-pos-system/backend/seed.js script. Import dotenv, mongoose, models (User, MenuItem). Call dotenv.config(). Connect to MongoDB. Clear existing data with deleteMany(). Create admin user (username: 'admin', password: bcrypt hashed 'admin123', name: 'Admin User', role: 'admin'), seller user (username: 'seller', password: hashed 'seller123', name: 'Seller User', role: 'seller'). Create 10-15 sample menu items across categories (Coffee, Tea, Snacks, Meals) with varied prices (₹20-₹200) and all available: true. Log success messages. Close connection. Add package.json script "seed": "node seed.js".
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/backend/seed.js, /Users/rahul/Aelish/cafe/cafe-pos-system/backend/package.json
      Verify: `npm run seed` in backend directory executes successfully and logs 'Database seeded'.

- [ ] 37. Test backend API endpoints with curl or Postman.
      Start backend server with `npm run dev`. Test each endpoint: (1) POST /api/auth/login with admin credentials returns token; (2) GET /api/menu with auth token returns menu items; (3) POST /api/menu with auth token creates new item; (4) GET /api/users with admin token returns users; (5) POST /api/bills with auth token creates bill; (6) GET /api/bills/today with auth token returns today's bills. Document any errors found and verify all endpoints return expected status codes and data structures.
      Files: N/A (manual testing)
      Verify: All 6 API endpoint tests pass with correct responses and status codes.

- [ ] 38. Test frontend application end-to-end.
      Start frontend with `npm start` and backend with `npm run dev`. Navigate to http://localhost:4200. Test complete user flows: (1) Login as admin → verify redirect to /admin/dashboard → check dashboard shows correct data → navigate to menu management → add new menu item → verify it appears in list → edit item → delete item; (2) Navigate to users → create new seller account → reset password → toggle status; (3) Navigate to sales report → verify bills displayed → test date filter; (4) Logout → login as seller → verify redirect to /pos/billing → add items to cart → adjust quantities → generate bill → verify bill created → check today's bills tab shows new bill → test print functionality; (5) Verify seller cannot access /admin routes (redirects to /pos/billing); (6) Verify logout works and redirects to login. Document any UI/UX issues or bugs found.
      Files: N/A (manual testing)
      Verify: All user flows complete successfully without errors, role-based access control works correctly, and IST timezone handling is correct for today's bills.

## Final Steps

- [ ] 39. Update README with setup and run instructions.
      Create comprehensive README.md at project root with sections: Project Overview, Tech Stack, Features, Prerequisites (Node.js, MongoDB), Installation (clone repo, install backend deps, install frontend deps, configure .env), Database Setup (run seed script), Running the Application (start backend, start frontend, access URLs), Default Credentials (admin and seller login details), API Endpoints documentation, Folder Structure, Security Notes (JWT, bcrypt, CORS), Future Enhancements. Include clear step-by-step commands for each setup phase.
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/README.md
      Verify: `cat README.md` shows complete documentation.

- [ ] 40. Production readiness checklist and deployment notes.
      Create DEPLOYMENT.md with production checklist: (1) Generate strong JWT_SECRET; (2) Update MONGODB_URI for production database; (3) Configure CORS for production frontend URL; (4) Update environment.prod.ts with production API URL; (5) Enable Angular production build optimizations; (6) Add input validation and sanitization; (7) Add rate limiting middleware; (8) Enable HTTPS; (9) Add logging (Winston/Morgan); (10) Add error monitoring (Sentry); (11) Add API documentation (Swagger); (12) Configure MongoDB indexes for performance; (13) Add automated tests; (14) Set up CI/CD pipeline. Include deployment commands for common platforms (Heroku, AWS, DigitalOcean).
      Files: /Users/rahul/Aelish/cafe/cafe-pos-system/DEPLOYMENT.md
      Verify: `cat DEPLOYMENT.md` shows complete deployment guide.

---

## Implementation Notes

### Backend Technology Stack
- **Runtime**: Node.js with CommonJS modules
- **Framework**: Express 5.3.0
- **Database**: MongoDB with Mongoose 9.12.2
- **Authentication**: JWT (jsonwebtoken 9.0.3) + bcryptjs 3.0.3
- **Dev Tools**: nodemon 3.1.14

### Frontend Technology Stack
- **Framework**: Angular 22.2.0 (standalone components)
- **UI Library**: Angular Material 22.2.7
- **State Management**: Services with RxJS 7.8.0
- **Build Tool**: Angular CLI 22.2.7 with esbuild
- **Testing**: Vitest 5.0.0

### Key Architectural Decisions

1. **JWT Storage**: Using localStorage for token storage. For production, consider httpOnly cookies for enhanced security.

2. **IST Timezone Handling**: getTodayBills computes start/end of day in IST (UTC+5:30) on the backend. Calculate IST from UTC by adding 5.5 hours: `const now = new Date(); const istOffset = 5.5 * 60 * 60 * 1000; const istNow = new Date(now.getTime() + istOffset);` then set hours to 0 for start and 23:59:59 for end.

3. **Role-Based Access Control**: Implemented with two guards (authGuard, adminGuard) in sequence. Admin routes use both; seller routes use only authGuard. Backend should also verify roles in middleware for admin-only endpoints (users, advanced reports).

4. **Bill Data Structure**: Bills store denormalized item data (name, price) at bill creation time to preserve historical accuracy even if menu items change later. menuItemId reference allows optional joins.

5. **Angular 22 Patterns**: All components use standalone: true pattern with direct imports array. Services use @Injectable({providedIn: 'root'}). Routes use functional guards (CanActivateFn). HTTP interceptors use HttpInterceptorFn.

6. **Material Design**: Using Angular Material 22 with custom theme. Mat.theme() in styles.scss applies global theming. All form fields use Material components for consistency.

7. **Error Handling**: Backend controllers wrap async operations with try-catch and return appropriate status codes. Frontend services return Observables; components subscribe and handle errors locally with MatSnackBar notifications.

8. **Build & Development**: Backend uses nodemon for hot reload. Frontend uses `ng serve` on port 4200. CORS configured to allow localhost:4200 during development.

### Verification Strategy

Each step includes a concrete verification command:
- Backend files: Node require() checks confirm syntax and exports
- Routes: Check router.stack length confirms routes registered
- Server: Start and check for connection logs
- Frontend: `npm run build --configuration development` confirms no TypeScript/template errors
- Integration: Manual E2E testing with documented user flows
- API: curl/Postman tests for each endpoint

### Dependencies Already Installed

Backend: bcryptjs, cors, dotenv, express, jsonwebtoken, mongoose, nodemon
Frontend: Angular 22 core packages, Material 22, RxJS, Express (SSR), Vitest

No additional package installations required - implementation uses existing dependencies.

---

**Total Steps**: 40
**Estimated Implementation Time**: 8-12 hours for experienced developer
**Critical Path**: Backend setup → Models → Controllers → Routes → Server → Frontend services → Components → Integration testing
