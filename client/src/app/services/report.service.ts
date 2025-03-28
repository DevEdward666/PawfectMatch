import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Report, ReportForm, ReportResponse, ReportResponseForm } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  getUserReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/user`);
  }

  getAllReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.apiUrl);
  }

  getReportById(id: number): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`);
  }

  submitReport(reportData: ReportForm, image?: File): Observable<Report> {
    const formData = new FormData();
    
    // Add report data to form
    Object.keys(reportData).forEach(key => {
      formData.append(key, (reportData as any)[key]);
    });
    
    // Add image if available
    if (image) {
      formData.append('image', image);
    }
    
    return this.http.post<Report>(this.apiUrl, formData);
  }

  updateReportStatus(id: number, status: 'pending' | 'reviewing' | 'resolved'): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}/status`, { status });
  }

  respondToReport(reportId: number, responseData: ReportResponseForm): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.apiUrl}/${reportId}/responses`, responseData);
  }

  deleteReport(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}