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
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { UserService, User } from '../../../core/services/user';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
            MatSelectModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} User</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%;margin-bottom:.75rem">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" required>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%;margin-bottom:.75rem">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%;margin-bottom:.75rem" *ngIf="!data">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password">
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%;margin-bottom:.75rem">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role" required>
            <mat-option value="seller">Seller</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </mat-dialog-actions>
  `
})
export class UserDialog {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef);
  fb = inject(FormBuilder);
  userService = inject(UserService);
  snackBar = inject(MatSnackBar);
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      username: [this.data?.username || '', Validators.required],
      name:     [this.data?.name || '',     Validators.required],
      password: ['', this.data ? [] : [Validators.required]],
      role:     [this.data?.role || 'seller', Validators.required]
    });
  }

  save() {
    if (this.form.invalid) return;
    const payload = this.data
      ? { name: this.form.value.name, role: this.form.value.role }
      : this.form.value;
    const op = this.data?._id ? this.userService.update(this.data._id, payload) : this.userService.create(this.form.value);
    op.subscribe({
      next: () => { this.snackBar.open('User saved!', 'Close', { duration: 2500 }); this.dialogRef.close(true); },
      error: (e) => this.snackBar.open(e.error?.message || 'Failed to save user', 'Close', { duration: 3000 })
    });
  }
}

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Reset Password</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>New Password</mat-label>
          <input matInput type="password" formControlName="password" required>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Reset</button>
    </mat-dialog-actions>
  `
})
export class ResetPasswordDialog {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef);
  fb = inject(FormBuilder);
  userService = inject(UserService);
  snackBar = inject(MatSnackBar);
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({ password: ['', Validators.required] });
  }

  save() {
    if (this.form.invalid) return;
    this.userService.resetPassword(this.data.id, this.form.value.password).subscribe({
      next: () => { this.snackBar.open('Password reset!', 'Close', { duration: 2500 }); this.dialogRef.close(true); },
      error: (e) => this.snackBar.open(e.error?.message || 'Failed', 'Close', { duration: 3000 })
    });
  }
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatSnackBarModule, MatSidenavModule, MatToolbarModule,
    MatListModule, MatDividerModule, MatProgressSpinnerModule, MatTooltipModule,
    RouterModule, MatDialogModule
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagement implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  users: User[] = [];
  displayedColumns = ['username', 'name', 'role', 'isActive', 'actions'];
  loading = true;
  isMobile = false;
  private bpSub!: Subscription;

  constructor(
    private userService: UserService,
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
    this.loadUsers();
  }

  ngOnDestroy() { this.bpSub?.unsubscribe(); }

  loadUsers() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openDialog(user?: User) {
    const ref = this.dialog.open(UserDialog, { width: '420px', maxWidth: '95vw', data: user });
    ref.afterClosed().subscribe(r => { if (r) this.loadUsers(); });
  }

  openResetPasswordDialog(user: User) {
    const ref = this.dialog.open(ResetPasswordDialog, { width: '380px', maxWidth: '95vw', data: { id: user._id } });
    ref.afterClosed().subscribe(r => { if (r) this.loadUsers(); });
  }

  toggleStatus(id: string) {
    this.userService.toggleStatus(id).subscribe({
      next: () => { this.snackBar.open('Status updated', 'Close', { duration: 2500 }); this.loadUsers(); },
      error: (e) => this.snackBar.open(e.error?.message || 'Failed', 'Close', { duration: 3000 })
    });
  }

  toggleSidenav() { this.sidenav.toggle(); }
  closeSidenavIfMobile() { if (this.isMobile) this.sidenav.close(); }
}
