import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-message-detail',
  templateUrl: './message-detail.page.html',
  styleUrls: ['./message-detail.page.scss'],
})
export class MessageDetailPage implements OnInit {
  messageId: number = 0;
  message: Message | null = null;
  loading: boolean = true;
  currentUser: User | null = null;
  replyForm: FormGroup;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    this.replyForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.messageId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    
    if (this.messageId) {
      this.loadMessageDetails();
    } else {
      this.toastService.error('Invalid message ID');
      this.router.navigate(['/tabs/messages']);
    }
  }

  async loadMessageDetails() {
    this.loading = true;
    
    try {
      this.apiService.get<any>(`messages/${this.messageId}`).subscribe(
        response => {
          if (response.success) {
            this.message = response.data;
          } else {
            this.toastService.error('Failed to load message details');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching message details:', error);
          this.toastService.error('Failed to load message details');
          this.loading = false;
          this.router.navigate(['/tabs/messages']);
        }
      );
    } catch (error) {
      console.error('Error loading message details:', error);
      this.loading = false;
    }
  }
  
  async reply() {
    if (this.replyForm.invalid || !this.message) return;
    
    await this.loadingService.show('Sending reply...');
    
    const messageData = {
      receiverId: this.isMessageFromUser() ? this.message.senderId : this.message.receiverId,
      subject: `RE: ${this.message.subject || 'No Subject'}`,
      content: this.replyForm.value.content
    };
    
    this.apiService.post<any>('messages', messageData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Reply sent successfully!');
          this.replyForm.reset();
          this.router.navigate(['/tabs/messages']);
        } else {
          this.toastService.error(response.message || 'Failed to send reply');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to send reply');
      }
    );
  }
  
  isMessageFromUser(): boolean {
    return this.message?.senderId === this.currentUser?.id;
  }
  
  async deleteMessage() {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this message?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.confirmDeleteMessage();
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async confirmDeleteMessage() {
    await this.loadingService.show('Deleting message...');
    
    this.apiService.delete<any>(`messages/${this.messageId}`).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Message deleted successfully');
          this.router.navigate(['/tabs/messages']);
        } else {
          this.toastService.error(response.message || 'Failed to delete message');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to delete message');
      }
    );
  }
  
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  goBack() {
    this.router.navigate(['/tabs/messages']);
  }
}
