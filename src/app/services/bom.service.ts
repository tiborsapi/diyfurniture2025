import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface BomItem {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface FurnitureBackendItem {
  id: number;
  width: number;
  height: number;
  depth: number;
}

@Injectable({
  providedIn: "root",
})
export class BomService {
  private readonly baseUrl = environment.apiBase;

  constructor(private http: HttpClient) {}

  // GET /api/bom?bodyId=:id
  getBom(bodyId: number): Observable<BomItem[]> {
    const params = new HttpParams().set("bodyId", String(bodyId));
    return this.http.get<BomItem[]>(`${this.baseUrl}/bom`, { params });
  }

  getBoms(): Observable<BomItem[]> {
    return this.http.get<BomItem[]>(`${this.baseUrl}/bom`);
  }

  //   getBomForProject(projectId: number): Observable<BomItem[]> {
  //     return this.http.get<BomItem[]>(`${this.baseUrl}?projectId=${projectId}`);
  //   }

  getBomForProject(): Observable<FurnitureBackendItem[]> {
    return this.http.get<FurnitureBackendItem[]>(
      `${this.baseUrl}/furniture/all`
    );
  }

  addBom(item: BomItem): Observable<BomItem> {
    return this.http.post<BomItem>(`${this.baseUrl}`, item);
  }
  getMockBomForProject(): Observable<FurnitureBackendItem[]> {
    return new Observable((observer) => {
      // SIMULATE ERROR (always):
      // observer.error(new Error('Mock error'));
      // return;

      // SIMULATE ERROR (50% chance):
      const shouldFail = Math.random() < 0.5;

      setTimeout(() => {
        if (shouldFail) {
          observer.error(new Error("Mock error: failed to fetch data"));
          return;
        }

        observer.next([
          { id: 1, width: 100, height: 200, depth: 40 },
          { id: 2, width: 50, height: 120, depth: 30 },
          { id: 3, width: 80, height: 160, depth: 35 },
          { id: 1, width: 100, height: 200, depth: 40 },
          { id: 2, width: 50, height: 120, depth: 30 },
          { id: 3, width: 80, height: 160, depth: 35 },
          { id: 1, width: 100, height: 200, depth: 40 },
          { id: 2, width: 50, height: 120, depth: 30 },
          { id: 3, width: 80, height: 160, depth: 35 },
          { id: 1, width: 100, height: 200, depth: 40 },
          { id: 2, width: 50, height: 120, depth: 30 },
          { id: 3, width: 80, height: 160, depth: 35 },
          { id: 1, width: 100, height: 200, depth: 40 },
          { id: 2, width: 50, height: 120, depth: 30 },
          { id: 3, width: 80, height: 160, depth: 35 },
          { id: 1, width: 100, height: 200, depth: 40 },
          { id: 2, width: 50, height: 120, depth: 30 },
          { id: 3, width: 80, height: 160, depth: 35 },
        ]);
        observer.complete();
      }, 800);
    });
  }
}
