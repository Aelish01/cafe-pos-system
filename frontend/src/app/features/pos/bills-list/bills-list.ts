import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BillService, Bill } from '../../../core/services/bill';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-bills-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatChipsModule,
    MatSnackBarModule,
    DatePipe
  ],
  templateUrl: './bills-list.html',
  styleUrl: './bills-list.scss'
})
export class BillsList implements OnInit {
  bills: Bill[] = [];
  isLoading = true;
  totalSales = 0;
  displayedColumns = ['time', 'items', 'total', 'actions'];

  get todayDate(): string {
    return new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  constructor(
    private billService: BillService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadBills();
  }

  loadBills() {
    this.isLoading = true;
    this.billService.getTodayBills().subscribe({
      next: (bills) => {
        this.bills = bills;
        this.totalSales = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load bills', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  trackByBill(index: number, bill: Bill): string | number {
    return bill._id ?? index;
  }

  reprintBill(bill: Bill) {
    const printWindow = window.open('', '', 'height=700,width=420');
    if (!printWindow) return;

    const rows = bill.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${Number(item.price).toFixed(2)}</td>
        <td style="text-align:right">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill Reprint</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 20px; font-size: 13px; }
            .header { text-align: center; margin-bottom: 12px; }
            .header h2 { font-size: 20px; letter-spacing: 2px; }
            .header p { font-size: 11px; color: #555; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            thead th { border-bottom: 1px solid #000; padding: 4px 2px; font-size: 12px; }
            td { padding: 4px 2px; }
            .footer { text-align: center; margin-top: 16px; font-size: 12px; }
            .total-row { font-weight: bold; font-size: 14px; }
            .reprint-label { text-align: center; font-size: 11px; color: #888; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>☕ CAFE POS</h2>
            <p>${new Date(bill.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            ${bill.createdByName ? `<p>Served by: ${bill.createdByName}</p>` : ''}
          </div>
          <p class="reprint-label">*** REPRINT ***</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="text-align:left">Item</th>
                <th style="text-align:center">Qty</th>
                <th style="text-align:right">Price</th>
                <th style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="divider"></div>
          <table>
            <tr class="total-row">
              <td>TOTAL</td>
              <td style="text-align:right">₹${Number(bill.totalAmount).toFixed(2)}</td>
            </tr>
          </table>
          <div class="footer">
            <p>Thank you for visiting!</p>
            <p>Please come again ☕</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
