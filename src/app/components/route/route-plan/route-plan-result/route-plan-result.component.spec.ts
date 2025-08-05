import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutePlanResultComponent } from './route-plan-result.component';

describe('RoutePlanResultComponent', () => {
  let component: RoutePlanResultComponent;
  let fixture: ComponentFixture<RoutePlanResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutePlanResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutePlanResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
