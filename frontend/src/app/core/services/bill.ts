import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Bill {
  _id?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class BillService {
  private readonly API = 'https://cafe-pos-system-9ptq.onrender.com/api';

  constructor(private http: HttpClient) {}

  createBill(bill: any): Observable<Bill> {
    return this.http.post<Bill>(`${this.API}/bills`, bill);
  }

  getAllBills(params?: any): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.API}/bills`, { params });
  }

  getTodayBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.API}/bills/today`);
  }
}
