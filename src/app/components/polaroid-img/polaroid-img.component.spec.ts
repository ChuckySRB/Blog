import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolaroidImgComponent } from './polaroid-img.component';

describe('PolaroidImgComponent', () => {
  let component: PolaroidImgComponent;
  let fixture: ComponentFixture<PolaroidImgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolaroidImgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolaroidImgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
