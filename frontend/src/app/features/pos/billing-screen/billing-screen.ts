import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuService, MenuItem } from '../../../core/services/menu';
import { BillService } from '../../../core/services/bill';
import { AuthService } from '../../../core/services/auth';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

@Component({
  selector: 'app-billing-screen',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './billing-screen.html',
  styleUrl: './billing-screen.scss'
})
export class BillingScreen implements OnInit {
  menuItems: MenuItem[] = [];
  categories: string[] = [];
  selectedCategory = 'All';
  cart: CartItem[] = [];
  isGenerating = false;

  constructor(
    private menuService: MenuService,
    private billService: BillService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadMenu();
  }

  loadMenu() {
    this.menuService.getAll().subscribe({
      next: (items) => {
        this.menuItems = items.filter(item => item.available);
        const cats = Array.from(new Set(items.filter(i => i.available).map(i => i.category)));
        this.categories = ['All', ...cats];
      },
      error: () => this.snackBar.open('Failed to load menu', 'Close', { duration: 3000 })
    });
  }

  get filteredMenuItems(): MenuItem[] {
    if (this.selectedCategory === 'All') return this.menuItems;
    return this.menuItems.filter(item => item.category === this.selectedCategory);
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  addToCart(item: MenuItem) {
    const existing = this.cart.find(c => c.item._id === item._id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ item, quantity: 1 });
    }
  }

  updateQuantity(index: number, delta: number) {
    this.cart[index].quantity += delta;
    if (this.cart[index].quantity <= 0) {
      this.cart.splice(index, 1);
    }
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  clearCart() {
    this.cart = [];
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  }

  get cartItemCount(): number {
    return this.cart.reduce((sum, c) => sum + c.quantity, 0);
  }

  generateAndPrint() {
    if (this.cart.length === 0) {
      this.snackBar.open('Cart is empty', 'Close', { duration: 3000 });
      return;
    }

    this.isGenerating = true;
    const payload = {
      items: this.cart.map(c => ({
        menuItemId: c.item._id!,
        quantity: c.quantity
      }))
    };

    this.billService.createBill(payload).subscribe({
      next: (bill) => {
        this.isGenerating = false;
        this.snackBar.open('Bill generated!', 'Close', { duration: 3000 });
        this.printReceipt(bill);
        this.cart = [];
      },
      error: (err) => {
        this.isGenerating = false;
        this.snackBar.open(err.error?.message || 'Failed to generate bill', 'Close', { duration: 4000 });
      }
    });
  }

  private printReceipt(bill: any) {
    const seller = this.authService.getUser();
    const printWindow = window.open('', '', 'height=700,width=420');
    if (!printWindow) return;

    const rows = (bill.items || this.cart.map(c => ({
      name: c.item.name,
      price: c.item.price,
      quantity: c.quantity
    }))).map((item: any) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${Number(item.price).toFixed(2)}</td>
        <td style="text-align:right">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`).join('');

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
              <td style="text-align:right">₹${Number(bill.totalAmount ?? this.cartTotal).toFixed(2)}</td>
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
