import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { HistoryEntry } from '../interfaces/interfaces';
import { url } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private baseUrl = url.base_url + '/history'; // Ajusta la URL según tu backend

  constructor(private http: HttpClient, private auth: AuthService) {}

  getHistory(): Observable<HistoryEntry[]> {
    return from(this.auth.getIdToken())
    .pipe(
      switchMap(token => {
       const headers = new HttpHeaders({ Authorization: `Bearer ${token}` }); 
        return this.http.get<HistoryEntry[]>(this.baseUrl, { headers });
      })
    );
  }
}
