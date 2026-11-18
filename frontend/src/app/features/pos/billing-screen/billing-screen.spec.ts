import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BillingScreen } from './billing-screen';

describe('BillingScreen', () => {
  let component: BillingScreen;
  let fixture: ComponentFixture<BillingScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingScreen],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingScreen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
