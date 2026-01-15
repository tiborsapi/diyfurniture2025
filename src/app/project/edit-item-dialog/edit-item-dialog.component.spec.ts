import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditProjectDialogComponent } from './edit-item-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ProjectService } from '../../services/project.service';
import { of } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

describe('EditProjectDialogComponent', () => {
  let component: EditProjectDialogComponent;
  let fixture: ComponentFixture<EditProjectDialogComponent>;
  let mockProjectService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockProjectService = jasmine.createSpyObj(['getProjectVersions', 'updateProject', 'restoreVersion']);
    mockDialogRef = jasmine.createSpyObj(['close']);

    // Mock initial data and service responses
    mockProjectService.getProjectVersions.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [ EditProjectDialogComponent ],
      imports: [ 
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatIconModule,
        MatProgressSpinnerModule
       ],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { project: { id: 1, name: 'Test', description: 'Desc' } } }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load versions on init', () => {
    expect(mockProjectService.getProjectVersions).toHaveBeenCalledWith(1);
  });

  it('should call updateProject and close dialog on save', () => {
    mockProjectService.updateProject.and.returnValue(of({ id: 1, name: 'New Name' }));
    
    component.editForm.setValue({ name: 'New Name', description: 'New Desc' });
    component.onSave();

    expect(mockProjectService.updateProject).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});