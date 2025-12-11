import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventChat } from './event-chat';

describe('EventChat', () => {
  let component: EventChat;
  let fixture: ComponentFixture<EventChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventChat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
