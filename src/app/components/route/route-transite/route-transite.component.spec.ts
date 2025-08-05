import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteTransiteComponent } from './route-transite.component';

describe('RouteTransiteComponent', () => {
  let component: RouteTransiteComponent;
  let fixture: ComponentFixture<RouteTransiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteTransiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RouteTransiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
