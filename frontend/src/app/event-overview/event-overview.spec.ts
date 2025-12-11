import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventOverview } from './event-overview';

describe('EventOverview', () => {
  let component: EventOverview;
  let fixture: ComponentFixture<EventOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
