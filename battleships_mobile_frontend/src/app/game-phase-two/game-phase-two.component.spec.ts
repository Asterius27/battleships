import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePhaseTwoComponent } from './game-phase-two.component';

describe('GamePhaseTwoComponent', () => {
  let component: GamePhaseTwoComponent;
  let fixture: ComponentFixture<GamePhaseTwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GamePhaseTwoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamePhaseTwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
