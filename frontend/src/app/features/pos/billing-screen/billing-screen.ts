import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { CartService } from '../../../core/services/cart';
import { AuthService } from '../../../core/services/auth';

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

  constructor(
    private menuService: MenuService,
    public cartService: CartService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.snackBar.open('Failed to load menu', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      }
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
    this.cartService.addItem(item);
  }
}
