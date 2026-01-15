import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, retry, map } from "rxjs/operators";
import { environment } from "../../environments/environment";
import {
  CreateProjectDto,
  ProjectItem,
  ProjectVersionResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
  ProjectDetailResponse,
} from "../models/project.models";
import { API_ENDPOINTS, API_URL } from "../constants/api-endpoints";
import axios from "axios";

export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Paginated response interface
export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ProjectService {
  private readonly baseUrl = `${environment.apiBase}/projects`;

  constructor(private http: HttpClient) {}

  async createProject(item: CreateProjectDto): Promise<ProjectItem> {
    try {
      const url = API_URL + API_ENDPOINTS.PROJECTS.BASE;
      const response = await axios.post<ProjectItem>(url, item);
      return response.data;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error; // Rethrow to handle it in the component
    }
  }

  // GET /projects - csak a content tömböt adja vissza
  getProjects(): Observable<Project[]> {
    console.log("Fetching from:", this.baseUrl);

    return this.http.get<PagedResponse<Project>>(this.baseUrl).pipe(
      map((response) => {
        console.log("Raw response:", response);
        return response.content;
      }),
      retry(1),
      catchError(this.handleError)
    );
  }

  // GET /projects (paginated) - teljes paginated response
  getProjectsPaged(
    page: number = 0,
    size: number = 10
  ): Observable<PagedResponse<Project>> {
    return this.http
      .get<PagedResponse<Project>>(`${this.baseUrl}?page=${page}&size=${size}`)
      .pipe(retry(1), catchError(this.handleError));
  }

  // GET /projects/:id
  getProject(id: number): Observable<Project> {
    return this.http
      .get<Project>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // PUT /projects/:id
  updateProject(
    id: number,
    request: UpdateProjectRequest
  ): Observable<UpdateProjectResponse> {
    return this.http
      .put<UpdateProjectResponse>(`${this.baseUrl}/${id}`, request)
      .pipe(catchError(this.handleError));
  }

  // GET /projects/:id/versions
  getProjectVersions(id: number): Observable<ProjectVersionResponse[]> {
    return this.http
      .get<ProjectVersionResponse[]>(`${this.baseUrl}/${id}/versions`)
      .pipe(catchError(this.handleError));
  }

  // POST /projects/:id/versions/:versionId/restore
  restoreVersion(projectId: number, versionId: number): Observable<Project> {
    // This matches the standard REST pattern for restore
    return this.http.post<Project>(
      `${this.baseUrl}/${projectId}/versions/${versionId}/restore`,
      {}
    );
  }

  async deleteProject(id: number): Promise<void> {
    try {
      const url = `${API_URL}${API_ENDPOINTS.PROJECTS.BASE}/${id}`;
      await axios.delete(url);
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }

  // POST /projects/:id/archive
  archiveProject(id: number): Observable<Project> {
    return this.http
      .post<Project>(`${this.baseUrl}/${id}/archive`, {})
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error("API Error:", error);
    return throwError(() => error);
  }

  getProjectDetail(id: number): Observable<ProjectDetailResponse> {
    return this.http
      .get<ProjectDetailResponse>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Mock verzió teszteléshez
  getMockProjects(): Observable<Project[]> {
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next([
          {
            id: 1,
            name: "Living Room Set",
            description: "Modern furniture collection",
            createdAt: "2026-01-10T10:30:00.000000",
            updatedAt: "2026-01-12T15:45:00.000000",
          },
          {
            id: 2,
            name: "Office Desk",
            description: "Ergonomic workspace",
            createdAt: "2026-01-08T09:00:00.000000",
            updatedAt: "2026-01-11T14:20:00.000000",
          },
          {
            id: 3,
            name: "Kitchen Cabinet",
            description: "Storage solution",
            createdAt: "2026-01-05T11:15:00.000000",
            updatedAt: "2026-01-09T16:30:00.000000",
          },
          {
            id: 4,
            name: "Bedroom Wardrobe",
            description: "Spacious closet",
            createdAt: "2026-01-03T08:45:00.000000",
            updatedAt: "2026-01-07T12:00:00.000000",
          },
          {
            id: 5,
            name: "Bookshelf",
            description: "Wall-mounted shelving",
            createdAt: "2026-01-02T14:00:00.000000",
            updatedAt: "2026-01-06T10:15:00.000000",
          },
          {
            id: 6,
            name: "Dining Table",
            description: "Extendable table for 6-8",
            createdAt: "2025-12-28T09:30:00.000000",
            updatedAt: "2026-01-04T11:45:00.000000",
          },
          {
            id: 7,
            name: "TV Stand",
            description: "Entertainment center",
            createdAt: "2025-12-25T16:00:00.000000",
            updatedAt: "2026-01-02T13:30:00.000000",
          },
          {
            id: 8,
            name: "Shoe Rack",
            description: "Entryway organizer",
            createdAt: "2025-12-20T10:00:00.000000",
            updatedAt: "2025-12-30T09:00:00.000000",
          },
        ]);
        observer.complete();
      }, 800);
    });
  }

  /**
   * Mock project detail with versions and bodies
   * Matches the actual API response from /api/projects/:id
   */
  getMockProjectDetail(id: number): Observable<ProjectDetailResponse> {
    return new Observable((observer) => {
      setTimeout(() => {
        // Mock data based on the actual API response format
        const mockDetails: Record<number, ProjectDetailResponse> = {
          1: {
            id: 1,
            name: "Living Room Set",
            description:
              "Modern furniture collection with sofa, coffee table, and TV stand",
            createdAt: "2026-01-10T10:30:00.000000",
            updatedAt: "2026-01-12T15:45:00.000000",
            deletedAt: null,
            versions: [
              {
                id: 1,
                versionNumber: 1,
                savedAt: "2026-01-10T10:30:00.000000",
                versionNote: "Initial version",
                name: "Living Room Set",
                description: "Modern furniture collection",
                bodies: [
                  { id: 1, width: 2200, heigth: 900, depth: 850 },
                  { id: 2, width: 1200, heigth: 450, depth: 600 },
                ],
              },
              {
                id: 2,
                versionNumber: 2,
                savedAt: "2026-01-11T09:15:00.000000",
                versionNote: "Added TV stand dimensions",
                name: "Living Room Set",
                description: "Modern furniture collection with TV stand",
                bodies: [
                  { id: 3, width: 2200, heigth: 900, depth: 850 },
                  { id: 4, width: 1200, heigth: 450, depth: 600 },
                  { id: 5, width: 1800, heigth: 550, depth: 400 },
                ],
              },
              {
                id: 3,
                versionNumber: 3,
                savedAt: "2026-01-12T15:45:00.000000",
                versionNote: "Final adjustments",
                name: "Living Room Set",
                description:
                  "Modern furniture collection with sofa, coffee table, and TV stand",
                bodies: [
                  { id: 6, width: 2400, heigth: 950, depth: 900 },
                  { id: 7, width: 1200, heigth: 450, depth: 600 },
                  { id: 8, width: 1800, heigth: 550, depth: 420 },
                ],
              },
            ],
          },
          2: {
            id: 2,
            name: "Office Desk",
            description: "Ergonomic workspace with adjustable height",
            createdAt: "2026-01-08T09:00:00.000000",
            updatedAt: "2026-01-11T14:20:00.000000",
            deletedAt: null,
            versions: [
              {
                id: 4,
                versionNumber: 1,
                savedAt: "2026-01-08T09:00:00.000000",
                versionNote: "Initial version",
                name: "Office Desk",
                description: "Ergonomic workspace",
                bodies: [{ id: 9, width: 1600, heigth: 750, depth: 800 }],
              },
              {
                id: 5,
                versionNumber: 2,
                savedAt: "2026-01-11T14:20:00.000000",
                versionNote: "Added drawer unit",
                name: "Office Desk",
                description: "Ergonomic workspace with adjustable height",
                bodies: [
                  { id: 10, width: 1600, heigth: 750, depth: 800 },
                  { id: 11, width: 400, heigth: 600, depth: 500 },
                ],
              },
            ],
          },
          3: {
            id: 3,
            name: "Kitchen Cabinet",
            description: "Storage solution for modern kitchen",
            createdAt: "2026-01-05T11:15:00.000000",
            updatedAt: "2026-01-09T16:30:00.000000",
            deletedAt: null,
            versions: [
              {
                id: 6,
                versionNumber: 1,
                savedAt: "2026-01-05T11:15:00.000000",
                versionNote: "Initial version",
                name: "Kitchen Cabinet",
                description: "Storage solution",
                bodies: [],
              },
            ],
          },
          // Project with no versions (edge case)
          4: {
            id: 4,
            name: "Bedroom Wardrobe",
            description: "Spacious closet with sliding doors",
            createdAt: "2026-01-03T08:45:00.000000",
            updatedAt: "2026-01-07T12:00:00.000000",
            deletedAt: null,
            versions: [],
          },
          // Archived project
          5: {
            id: 5,
            name: "Bookshelf",
            description: "Wall-mounted shelving - archived",
            createdAt: "2026-01-02T14:00:00.000000",
            updatedAt: "2026-01-06T10:15:00.000000",
            deletedAt: "2026-01-13T09:00:00.000000",
            versions: [
              {
                id: 7,
                versionNumber: 1,
                savedAt: "2026-01-02T14:00:00.000000",
                versionNote: "Initial version",
                name: "Bookshelf",
                description: "Wall-mounted shelving",
                bodies: [
                  { id: 12, width: 800, heigth: 2000, depth: 300 },
                  { id: 13, width: 800, heigth: 2000, depth: 300 },
                  { id: 14, width: 800, heigth: 2000, depth: 300 },
                ],
              },
            ],
          },
        };

        const detail = mockDetails[id];
        if (detail) {
          observer.next(detail);
          observer.complete();
        } else {
          // Return a default mock for unknown IDs
          observer.next({
            id: id,
            name: `Project ${id}`,
            description: "Auto-generated mock project",
            createdAt: "2026-01-01T00:00:00.000000",
            updatedAt: "2026-01-14T00:00:00.000000",
            deletedAt: null,
            versions: [
              {
                id: 100 + id,
                versionNumber: 1,
                savedAt: "2026-01-01T00:00:00.000000",
                versionNote: "Initial version",
                name: `Project ${id}`,
                description: "Auto-generated mock project",
                bodies: [
                  { id: 200 + id, width: 1000, heigth: 500, depth: 300 },
                ],
              },
            ],
          });
          observer.complete();
        }
      }, 500);
    });
  }

  /**
   * Mock paginated response
   */
  getMockProjectsPaged(
    page: number = 0,
    size: number = 10
  ): Observable<PagedResponse<Project>> {
    return new Observable((observer) => {
      setTimeout(() => {
        const allProjects: Project[] = [
          {
            id: 1,
            name: "Living Room Set",
            description: "Modern furniture collection",
            createdAt: "2026-01-10T10:30:00.000000",
            updatedAt: "2026-01-12T15:45:00.000000",
          },
          {
            id: 2,
            name: "Office Desk",
            description: "Ergonomic workspace",
            createdAt: "2026-01-08T09:00:00.000000",
            updatedAt: "2026-01-11T14:20:00.000000",
          },
          {
            id: 3,
            name: "Kitchen Cabinet",
            description: "Storage solution",
            createdAt: "2026-01-05T11:15:00.000000",
            updatedAt: "2026-01-09T16:30:00.000000",
          },
          {
            id: 4,
            name: "Bedroom Wardrobe",
            description: "Spacious closet",
            createdAt: "2026-01-03T08:45:00.000000",
            updatedAt: "2026-01-07T12:00:00.000000",
          },
          {
            id: 5,
            name: "Bookshelf",
            description: "Wall-mounted shelving",
            createdAt: "2026-01-02T14:00:00.000000",
            updatedAt: "2026-01-06T10:15:00.000000",
          },
          {
            id: 6,
            name: "Dining Table",
            description: "Extendable table for 6-8",
            createdAt: "2025-12-28T09:30:00.000000",
            updatedAt: "2026-01-04T11:45:00.000000",
          },
          {
            id: 7,
            name: "TV Stand",
            description: "Entertainment center",
            createdAt: "2025-12-25T16:00:00.000000",
            updatedAt: "2026-01-02T13:30:00.000000",
          },
          {
            id: 8,
            name: "Shoe Rack",
            description: "Entryway organizer",
            createdAt: "2025-12-20T10:00:00.000000",
            updatedAt: "2025-12-30T09:00:00.000000",
          },
        ];

        const start = page * size;
        const end = start + size;
        const content = allProjects.slice(start, end);
        const totalElements = allProjects.length;
        const totalPages = Math.ceil(totalElements / size);

        observer.next({
          content,
          totalPages,
          totalElements,
          size,
          number: page,
          first: page === 0,
          last: page >= totalPages - 1,
          empty: content.length === 0,
        });
        observer.complete();
      }, 800);
    });
  }
}
