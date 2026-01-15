import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddItemDialogComponent } from './add-item-dialog.component';
import { ProjectService } from '../../services/project.service';
import { MatButtonModule } from '@angular/material/button';

describe('AddItemDialogComponent', () => {
  let component: AddItemDialogComponent;
  let fixture: ComponentFixture<AddItemDialogComponent>;
  
  // Mocks
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddItemDialogComponent>>;
  let mockProjectService: jasmine.SpyObj<ProjectService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Create spies (mock objects)
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockProjectService = jasmine.createSpyObj('ProjectService', ['createProject']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [AddItemDialogComponent],
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule, // Important: Disable animations for testing
        MatDialogModule, // <--- ADD THIS to fix 'mat-dialog-content' error
        MatButtonModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid initially (submit disabled)', () => {
    expect(component.itemForm.valid).toBeFalse();
  });

  it('form should be valid when filled correctly', () => {
    component.itemForm.patchValue({
      name: 'Test Project',
     description: 'A sample project'
    });
    expect(component.itemForm.valid).toBeTrue();
  });

  // SUCCESS SCENARIO
  it('should call service, show toast, and close dialog on success', fakeAsync(() => {
    // Arrange
    const mockData = { name: 'Test', description: "Sample" };
    const mockResponse = { id: 123, ...mockData };
    
    component.itemForm.patchValue(mockData);
    // Mock the Promise resolution
    mockProjectService.createProject.and.returnValue(Promise.resolve(mockResponse));

    // Act
    component.onSubmit();
    
    // Check loading state immediately after click
    expect(component.isSaving).toBeTrue();

    // Advance time for promise resolution
    tick();

    // Assert
    expect(mockProjectService.createProject).toHaveBeenCalledWith(jasmine.objectContaining(mockData));
    expect(mockSnackBar.open).toHaveBeenCalled(); // Toast shown
    expect(mockDialogRef.close).toHaveBeenCalledWith(mockResponse); // Dialog closed with data
    expect(component.isSaving).toBeFalse(); // Loading stopped
  }));

  // ERROR SCENARIO
  it('should keep dialog open and show error message on failure', fakeAsync(() => {
    // Arrange
    component.itemForm.patchValue({ name: 'Fail', description: 'This will fail' });
    // Mock the Promise rejection
    mockProjectService.createProject.and.returnValue(Promise.reject('Server Error'));

    // Act
    component.onSubmit();
    tick();

    // Assert
    expect(mockProjectService.createProject).toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled(); // Should NOT close
    expect(component.errorMessage).toBe('Failed to create project. Please try again.'); // Banner text set
    expect(component.isSaving).toBeFalse();
  }));

  it('should close dialog when cancel is clicked', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});