import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { BillService, Bill } from '../../../core/services/bill';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule,
    MatSidenavModule, MatToolbarModule, MatListModule, MatDividerModule,
    MatProgressSpinnerModule, MatExpansionModule, RouterModule
  ],
  templateUrl: './sales-report.html',
  styleUrl: './sales-report.scss'
})
export class SalesReport implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  displayedColumns = ['createdAt', 'createdByName', 'itemCount', 'totalAmount'];
  loading = true;
  filterForm: FormGroup;
  isMobile = false;
  private bpSub!: Subscription;

  constructor(
    private billService: BillService,
    private fb: FormBuilder,
    public authService: AuthService,
    private bp: BreakpointObserver
  ) {
    this.filterForm = this.fb.group({ startDate: [''], endDate: [''] });
  }

  ngOnInit() {
    this.bpSub = this.bp.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(r => { this.isMobile = r.matches; });
    this.loadBills();
  }

  ngOnDestroy() { this.bpSub?.unsubscribe(); }

  loadBills() {
    this.loading = true;
    this.billService.getAllBills().subscribe({
      next: (bills) => { this.bills = bills; this.filteredBills = bills; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter() {
    const { startDate, endDate } = this.filterForm.value;
    if (!startDate && !endDate) { this.filteredBills = this.bills; return; }
    this.filteredBills = this.bills.filter(bill => {
      const d = new Date(bill.createdAt);
      if (startDate && endDate) return d >= new Date(startDate) && d <= new Date(endDate);
      if (startDate) return d >= new Date(startDate);
      if (endDate) return d <= new Date(endDate);
      return true;
    });
  }

  resetFilter() { this.filterForm.reset(); this.filteredBills = this.bills; }

  getTotalRevenue() { return this.filteredBills.reduce((s, b) => s + b.totalAmount, 0); }

  toggleSidenav() { this.sidenav.toggle(); }
  closeSidenavIfMobile() { if (this.isMobile) this.sidenav.close(); }
}
