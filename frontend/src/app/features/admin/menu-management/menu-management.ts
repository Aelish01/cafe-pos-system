import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
            MatCheckboxModule, MatButtonModule, MatDialogModule, MatIconModule],
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
          <input matInput type="number" formControlName="price" required min="0.01">
          <mat-error *ngIf="form.get('price')?.hasError('min')">Price must be greater than 0</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Discount Price (₹)</mat-label>
          <input matInput type="number" formControlName="discountPrice" min="0.01">
          <mat-hint>Optional; must be less than the regular price.</mat-hint>
        </mat-form-field>
        <p class="form-error" *ngIf="form.hasError('discountPriceInvalid') && form.get('discountPrice')?.touched">
          Discount price must be less than regular price.
        </p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" maxlength="1000"></textarea>
          <mat-hint align="end">{{ form.get('description')?.value?.length || 0 }}/1000</mat-hint>
        </mat-form-field>
        <div class="image-field">
          <span class="image-label">Menu image</span>
          <img *ngIf="imagePreview" [src]="imagePreview" alt="Menu item preview">
          <div class="image-actions">
            <label class="image-upload">
              <mat-icon>upload</mat-icon>
              {{ imagePreview ? 'Change image' : 'Choose image' }}
              <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onImageSelected($event)">
            </label>
            <button *ngIf="imagePreview" mat-button type="button" (click)="removeImage()">Remove image</button>
          </div>
          <small>JPEG, PNG or WebP; optimized to fit the server request limit (source up to 5 MB).</small>
          <mat-error *ngIf="imageError">{{ imageError }}</mat-error>
        </div>
        <mat-checkbox formControlName="available">Available for sale</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || isSaving || isImageProcessing">
        {{ isImageProcessing ? 'Optimizing image...' : isSaving ? 'Saving...' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field { width: 100%; margin-bottom: 0.75rem; }
    mat-checkbox { margin-bottom: 0.75rem; display: block; }
    .image-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1rem; }
    .image-label { color: #5D4037; font-size: 0.875rem; font-weight: 500; }
    .image-field img { width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; }
    .image-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .image-upload { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #5D4037; }
    .image-upload input { display: none; }
    .image-field small { color: #8D6E63; }
    .image-field mat-error { font-size: 0.75rem; }
    .form-error { margin: -0.5rem 0 0.75rem; color: #B3261E; font-size: 0.75rem; }
  `]
})
export class MenuDialog {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef);
  fb = inject(FormBuilder);
  menuService = inject(MenuService);
  snackBar = inject(MatSnackBar);
  cdr = inject(ChangeDetectorRef);
  form: FormGroup;
  imagePreview: string;
  imageError = '';
  isSaving = false;
  isImageProcessing = false;
  private imageChanged = false;

  constructor() {
    this.imagePreview = this.data?.image || '';
    this.form = this.fb.group({
      name: [this.data?.name || '', Validators.required],
      category: [this.data?.category || '', Validators.required],
      price: [this.data?.price ?? null, [Validators.required, Validators.min(0.01)]],
      discountPrice: [this.data?.discountPrice ?? null],
      description: [this.data?.description || '', Validators.maxLength(1000)],
      available: [this.data?.available ?? true]
    }, { validators: this.validateDiscountPrice });
  }

  private validateDiscountPrice(control: AbstractControl): ValidationErrors | null {
    const price = control.get('price')?.value;
    const discountPrice = control.get('discountPrice')?.value;
    if (discountPrice === null || discountPrice === '' || discountPrice === undefined) return null;
    return Number(discountPrice) > 0 && Number(discountPrice) < Number(price)
      ? null
      : { discountPriceInvalid: true };
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.imageError = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.imageError = 'Choose a JPEG, PNG or WebP image.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'Choose an image smaller than 5 MB.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    this.isImageProcessing = true;
    this.cdr.markForCheck();
    try {
      this.imagePreview = await this.compressImage(file);
      this.imageChanged = true;
    } catch (error) {
      this.imageError = error instanceof Error ? error.message : 'Could not process the selected image.';
    } finally {
      this.isImageProcessing = false;
      input.value = '';
      this.cdr.markForCheck();
    }
  }

  removeImage(): void {
    this.imagePreview = '';
    this.imageError = '';
    this.imageChanged = true;
  }

  private async compressImage(file: File): Promise<string> {
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Could not decode the selected image.'));
        image.src = objectUrl;
      });

      const maxBytes = 56 * 1024;
      let scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
      let quality = 0.78;

      for (let attempt = 0; attempt < 20; attempt++) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image processing is not available in this browser.');

        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(result => {
            if (result) resolve(result);
            else reject(new Error('Could not compress the selected image.'));
          }, 'image/jpeg', quality);
        });

        if (blob.size <= maxBytes) {
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('Could not read the optimized image.'));
            reader.onerror = () => reject(new Error('Could not read the optimized image.'));
            reader.readAsDataURL(blob);
          });
        }

        if (quality > 0.42) quality -= 0.12;
        else {
          scale *= 0.75;
          quality = 0.76;
        }
      }

      throw new Error('Image could not be optimized to fit the server limit. Please choose a simpler or smaller image.');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  save(): void {
    if (this.form.invalid || this.isSaving || this.isImageProcessing) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.imageChanged && this.imagePreview.length > 80_000) {
      this.imageError = 'Optimized image is still too large. Please choose a smaller image.';
      return;
    }

    const { name, category, price, discountPrice, description, available } = this.form.value;
    const payload = {
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      discountPrice: discountPrice === null || discountPrice === '' ? null : Number(discountPrice),
      description: description.trim(),
      ...(this.imageChanged ? { image: this.imagePreview } : {}),
      available
    };
    const request = this.data?._id
      ? this.menuService.update(this.data._id, payload)
      : this.menuService.create(payload);

    this.isSaving = true;
    request.subscribe({
      next: () => {
        this.snackBar.open('Saved!', 'Close', { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: error => {
        this.isSaving = false;
        this.snackBar.open(error.error?.message || 'Failed to save', 'Close', { duration: 3000 });
      }
    });
  }
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
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
  displayedColumns = ['image', 'name', 'category', 'price', 'discountPrice', 'available', 'actions'];
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
