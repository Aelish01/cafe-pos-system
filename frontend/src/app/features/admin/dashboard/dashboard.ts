import { ChangeDetectorRef, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { BillService } from '../../../core/services/bill';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  todaySales = 0;
  billCount = 0;
  loading = true;
  isMobile = false;
  private bpSub!: Subscription;

  constructor(
    private billService: BillService,
    public authService: AuthService,
    private bp: BreakpointObserver,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.bpSub = this.bp.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.cdr.markForCheck();
      });
    this.loadTodayStats();
  }

  ngOnDestroy() { this.bpSub?.unsubscribe(); }

  loadTodayStats() {
    this.billService.getTodayBills().subscribe({
      next: (bills) => {
        this.billCount = bills.length;
        this.todaySales = bills.reduce((sum, b) => sum + b.totalAmount, 0);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleSidenav() { this.sidenav.toggle(); }
  closeSidenavIfMobile() { if (this.isMobile) this.sidenav.close(); }
}
