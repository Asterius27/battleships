import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePhaseOneComponent } from './game-phase-one.component';

describe('GamePhaseOneComponent', () => {
  let component: GamePhaseOneComponent;
  let fixture: ComponentFixture<GamePhaseOneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GamePhaseOneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamePhaseOneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
