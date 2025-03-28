import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message, MessageForm, MessageResponse } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) { }

  getUserMessages(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(this.apiUrl);
  }

  getMessageById(id: number): Observable<Message> {
    return this.http.get<Message>(`${this.apiUrl}/${id}`);
  }

  sendMessage(messageData: MessageForm): Observable<Message> {
    return this.http.post<Message>(this.apiUrl, messageData);
  }

  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  markAsRead(id: number): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/${id}/read`, {});
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread`);
  }
}