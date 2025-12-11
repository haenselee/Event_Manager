import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentEvents } from './student-events';

describe('StudentEvents', () => {
  let component: StudentEvents;
  let fixture: ComponentFixture<StudentEvents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentEvents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentEvents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
