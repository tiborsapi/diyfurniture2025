import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FurnitureApiService {
  private baseUrl = 'http://localhost:8080/furniture'; 
  constructor(private http: HttpClient) { }

  saveFurniture(furnitureData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/add`, furnitureData);
  }

  getAllFurniture(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all`);
  }
}