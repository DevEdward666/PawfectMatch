import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Message, MessageResponse } from '../../models/message.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnInit {
  messages: MessageResponse = { inbox: [], sent: [] };
  loading: boolean = true;
  segment: string = 'inbox';
  currentUser: User | null = null;
  admins: User[] = [];
  messageForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authService: AuthService,
    private alertController: AlertController,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.messageForm = this.formBuilder.group({
      receiverId: ['', Validators.required],
      subject: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Check for query params (for pre-filled message)
    this.route.queryParams.subscribe(params => {
      if (params.subject) {
        this.messageForm.patchValue({
          subject: params.subject
        });
      }
      
      // If we have a petId or productId, update the content
      if (params.petId) {
        this.getAdmins();
        this.messageForm.patchValue({
          content: `I'm interested in the pet with ID ${params.petId}. Could you please provide more information?`
        });
      } else if (params.productId) {
        this.getAdmins();
        this.messageForm.patchValue({
          content: `I'm interested in the product with ID ${params.productId}. Could you please provide more information?`
        });
      }
    });
  }
  
  ionViewWillEnter() {
    this.loadMessages();
    this.getAdmins();
  }

  async loadMessages() {
    this.loading = true;
    
    try {
      this.apiService.get<any>('messages').subscribe(
        response => {
          if (response.success) {
            this.messages = response.data;
          } else {
            this.toastService.error('Failed to load messages');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching messages:', error);
          this.toastService.error('Failed to load messages');
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading messages:', error);
      this.loading = false;
    }
  }
  
  async getAdmins() {
    // We'll get all admins to send messages to
    try {
      // For simplicity, we'll make all admins available for messaging
      // In a real app, you'd have a dedicated endpoint for this
      this.admins = [{ id: 1, name: 'Admin', email: 'admin@petshop.com', role: 'admin' }] as User[];
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  }
  
  segmentChanged(event: any) {
    this.segment = event.detail.value;
  }
  
  viewMessage(message: Message) {
    this.router.navigate(['/message-detail', message.id]);
  }
  
  async composeMessage() {
    const alert = await this.alertController.create({
      header: 'New Message',
      inputs: [
        {
          name: 'receiverId',
          type: 'radio',
          label: 'Select Recipient',
          value: this.admins.length > 0 ? this.admins[0].id : null,
          checked: true
        },
        {
          name: 'subject',
          type: 'text',
          placeholder: 'Subject',
          value: this.messageForm.value.subject
        },
        {
          name: 'content',
          type: 'textarea',
          placeholder: 'Message content',
          value: this.messageForm.value.content
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send',
          handler: (data) => {
            if (!data.subject || !data.content) {
              this.toastService.warning('Please complete all fields');
              return false;
            }
            
            this.messageForm.setValue({
              receiverId: this.admins.length > 0 ? this.admins[0].id : 1, // Default to first admin
              subject: data.subject,
              content: data.content
            });
            
            this.sendMessage();
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async sendMessage() {
    if (this.messageForm.invalid) return;
    
    await this.loadingService.show('Sending message...');
    
    const messageData = {
      receiverId: this.messageForm.value.receiverId,
      subject: this.messageForm.value.subject,
      content: this.messageForm.value.content
    };
    
    this.apiService.post<any>('messages', messageData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Message sent successfully!');
          this.loadMessages();
          this.messageForm.reset();
        } else {
          this.toastService.error(response.message || 'Failed to send message');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to send message');
      }
    );
  }
  
  async deleteMessage(messageId: number, event: Event) {
    event.stopPropagation();
    
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
            this.confirmDeleteMessage(messageId);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async confirmDeleteMessage(messageId: number) {
    await this.loadingService.show('Deleting message...');
    
    this.apiService.delete<any>(`messages/${messageId}`).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Message deleted successfully');
          this.loadMessages();
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
  
  refreshMessages(event: any) {
    this.loadMessages();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
