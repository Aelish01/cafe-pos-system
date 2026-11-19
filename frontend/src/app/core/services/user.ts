import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  _id?: string;
  username: string;
  name: string;
  role: 'admin' | 'seller';
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = 'https://cafe-pos-system-9ptq.onrender.com/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API}/users`);
  }

  create(user: any): Observable<User> {
    return this.http.post<User>(`${this.API}/users`, user);
  }

  update(id: string, user: any): Observable<User> {
    return this.http.put<User>(`${this.API}/users/${id}`, user);
  }

  resetPassword(id: string, password: string): Observable<any> {
    return this.http.put(`${this.API}/users/${id}/reset-password`, { password });
  }

  toggleStatus(id: string): Observable<User> {
    return this.http.put<User>(`${this.API}/users/${id}/toggle-status`, {});
  }
}
