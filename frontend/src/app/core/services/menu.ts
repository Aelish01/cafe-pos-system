import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MenuItem {
  _id?: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly API = 'http://https://cafe-pos-system-9ptq.onrender.com/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.API}/menu`);
  }

  create(item: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.API}/menu`, item);
  }

  update(id: string, item: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.API}/menu/${id}`, item);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API}/menu/${id}`);
  }
}
