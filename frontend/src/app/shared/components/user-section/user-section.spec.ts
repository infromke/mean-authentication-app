import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSection } from './user-section';

describe('UserSection', () => {
  let component: UserSection;
  let fixture: ComponentFixture<UserSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSection],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
