import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return router.createUrlTree(['/login']);
    }
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return router.createUrlTree(['/login']);
    }
    
    if (payload.role === 'admin') {
      return true;
    }
    
    return router.createUrlTree(['/pos/billing']);
  } catch (error) {
    return router.createUrlTree(['/login']);
  }
};
