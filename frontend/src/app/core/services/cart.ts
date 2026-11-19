import { Injectable } from '@angular/core';
import { MenuItem } from './menu';

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  items: CartItem[] = [];

  addItem(item: MenuItem): void {
    const existing = this.items.find(cartItem => cartItem.item._id === item._id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ item, quantity: 1 });
    }
  }

  updateQuantity(index: number, delta: number): void {
    const cartItem = this.items[index];
    if (!cartItem) return;

    cartItem.quantity += delta;
    if (cartItem.quantity <= 0) this.removeItem(index);
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  clear(): void {
    this.items = [];
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  }
}
