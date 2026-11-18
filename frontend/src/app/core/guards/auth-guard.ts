import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  if (!token) {
    return router.createUrlTree(['/login']);
  }
  
  try {
    // Decode and check token expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return router.createUrlTree(['/login']);
    }
    return true;
  } catch (error) {
    // Invalid token format
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return router.createUrlTree(['/login']);
  }
};
