import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { MenuManagement } from './features/admin/menu-management/menu-management';
import { SalesReport } from './features/admin/sales-report/sales-report';
import { UserManagement } from './features/admin/user-management/user-management';
import { BillingScreen } from './features/pos/billing-screen/billing-screen';
import { BillsList } from './features/pos/bills-list/bills-list';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'admin', 
    canActivate: [authGuard, adminGuard], 
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'menu', component: MenuManagement },
      { path: 'sales', component: SalesReport },
      { path: 'users', component: UserManagement },
    ]
  },
  { 
    path: 'pos', 
    canActivate: [authGuard], 
    children: [
      { path: '', redirectTo: 'billing', pathMatch: 'full' },
      { path: 'billing', component: BillingScreen },
      { path: 'bills', component: BillsList },
    ]
  },
  { path: '**', redirectTo: '/login' },
];
