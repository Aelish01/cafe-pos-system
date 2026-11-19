import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { MenuService, MenuItem } from '../../../core/services/menu';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-menu-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
            MatCheckboxModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Menu Item</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <input matInput formControlName="category" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Price (₹)</mat-label>
          <input matInput type="number" formControlName="price" required min="0">
          <mat-error *ngIf="form.get('price')?.hasError('min')">Price must be ≥ 0</mat-error>
        </mat-form-field>
        <mat-checkbox formControlName="available">Available for sale</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field { width: 100%; margin-bottom: 0.75rem; }
    mat-checkbox { margin-bottom: 0.75rem; display: block; }
  `]
})
export class MenuDialog {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef);
  fb = inject(FormBuilder);
  menuService = inject(MenuService);
  snackBar = inject(MatSnackBar);
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name:      [this.data?.name || '',  Validators.required],
      category:  [this.data?.category || '', Validators.required],
      price:     [this.data?.price || 0,  [Validators.required, Validators.min(0)]],
      available: [this.data?.available ?? true]
    });
  }

  save() {
    if (this.form.invalid) return;
    const op = this.data?._id
      ? this.menuService.update(this.data._id, this.form.value)
      : this.menuService.create(this.form.value);
    op.subscribe({
      next: () => { this.snackBar.open('Saved!', 'Close', { duration: 2500 }); this.dialogRef.close(true); },
      error: (e) => this.snackBar.open(e.error?.message || 'Failed to save', 'Close', { duration: 3000 })
    });
  }
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatSnackBarModule, MatSidenavModule, MatToolbarModule,
    MatListModule, MatDividerModule, MatProgressSpinnerModule,
    RouterModule, MatDialogModule
  ],
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.scss'
})
export class MenuManagement implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  menuItems: MenuItem[] = [];
  displayedColumns = ['name', 'category', 'price', 'available', 'actions'];
  loading = true;
  isMobile = false;
  private bpSub!: Subscription;

  constructor(
    private menuService: MenuService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public authService: AuthService,
    private bp: BreakpointObserver,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.bpSub = this.bp.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(r => {
        this.isMobile = r.matches;
        this.cdr.markForCheck();
      });
    this.loadMenuItems();
  }

  ngOnDestroy() { this.bpSub?.unsubscribe(); }

  loadMenuItems() {
    this.loading = true;
    this.menuService.getAll().subscribe({
      next: (items) => {
        this.menuItems = items;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openDialog(item?: MenuItem) {
    const ref = this.dialog.open(MenuDialog, { width: '420px', maxWidth: '95vw', data: item });
    ref.afterClosed().subscribe(r => { if (r) this.loadMenuItems(); });
  }

  deleteItem(id: string) {
    if (!confirm('Delete this menu item?')) return;
    this.menuService.delete(id).subscribe({
      next: () => { this.snackBar.open('Deleted', 'Close', { duration: 2500 }); this.loadMenuItems(); },
      error: (e) => this.snackBar.open(e.error?.message || 'Failed to delete', 'Close', { duration: 3000 })
    });
  }

  toggleSidenav() { this.sidenav.toggle(); }
  closeSidenavIfMobile() { if (this.isMobile) this.sidenav.close(); }
}
