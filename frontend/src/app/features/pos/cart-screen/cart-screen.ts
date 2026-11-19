import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { Bill, BillService, PaymentMethod } from '../../../core/services/bill';
import { CartService } from '../../../core/services/cart';

@Component({
  selector: 'app-cart-screen',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatSnackBarModule,
    MatToolbarModule
  ],
  templateUrl: './cart-screen.html',
  styleUrl: './cart-screen.scss'
})
export class CartScreen {
  isGenerating = false;
  paymentMethod: PaymentMethod = 'cash';

  constructor(
    public cartService: CartService,
    public authService: AuthService,
    private billService: BillService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  generateAndPrint(): void {
    if (this.cartService.items.length === 0 || this.isGenerating) return;

    this.isGenerating = true;
    const payload = {
      items: this.cartService.items.map(({ item, quantity }) => ({
        menuItemId: item._id!,
        quantity
      })),
      paymentMethod: this.paymentMethod
    };

    this.billService.createBill(payload).subscribe({
      next: bill => {
        this.isGenerating = false;
        this.cartService.clear();
        this.snackBar.open('Bill generated!', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
        this.printReceipt(bill);
      },
      error: err => {
        this.isGenerating = false;
        this.snackBar.open(err.error?.message || 'Failed to generate bill', 'Close', { duration: 4000 });
        this.cdr.markForCheck();
      }
    });
  }

  private printReceipt(bill: Bill): void {
    const printWindow = window.open('', '', 'height=700,width=420');
    if (!printWindow) return;

    const rows = bill.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${Number(item.price).toFixed(2)}</td>
        <td style="text-align:right">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`).join('');
    const seller = this.authService.getUser();

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill Receipt</title>
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
          </style>
        </head>
        <body>
          <div class="header">
            <h2>☕ HAPPINESS CAFE</h2>
            <p>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            ${seller ? `<p>Served by: ${seller.name}</p>` : ''}
            <p>Payment: ${bill.paymentMethod === 'online' ? 'Online' : 'Cash'}</p>
          </div>
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
