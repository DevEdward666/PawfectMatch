import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ToastService } from '../../../services/toast.service';
import { Message } from '../../../models/message.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-message-management',
  templateUrl: './message-management.page.html',
  styleUrls: ['./message-management.page.scss'],
})
export class MessageManagementPage implements OnInit {
  messages: Message[] = [];
  users: User[] = [];
  loading: boolean = true;
  selectedMessage: Message | null = null;
  
  // Form for sending messages
  messageForm: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    this.messageForm = this.formBuilder.group({
      receiverId: [null, Validators.required],
      subject: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit() {
  }
  
  ionViewWillEnter() {
    this.loadMessages();
    this.loadUsers();
  }

  async loadMessages() {
    this.loading = true;
    
    try {
      this.apiService.get<any>('messages/admin/all').subscribe(
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
  
  async loadUsers() {
    try {
      this.apiService.get<any>('users').subscribe(
        response => {
          if (response.success) {
            this.users = response.data;
          }
        }
      );
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }
  
  async viewMessage(message: Message) {
    this.selectedMessage = message;
    
    // Mark as read if it's not the sender viewing
    if (!message.isRead && message.receiverId !== this.selectedMessage.senderId) {
      // In a real app, you would call an API to mark as read
      message.isRead = true;
    }
    
    const alert = await this.alertController.create({
      header: message.subject || 'No Subject',
      subHeader: `From: ${message.sender?.name || 'Unknown'} | To: ${message.receiver?.name || 'Unknown'}`,
      message: message.content,
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        },
        {
          text: 'Reply',
          handler: () => {
            this.openReplyForm(message);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async openComposeForm() {
    if (this.users.length === 0) {
      this.toastService.error('No users available to message');
      return;
    }
    
    const inputs = this.users.map(user => ({
      type: 'radio',
      label: user.name,
      value: user.id,
      checked: false
    }));
    
    inputs[0].checked = true;
    
    const alert = await this.alertController.create({
      header: 'New Message',
      inputs: [
        ...inputs,
        {
          name: 'subject',
          type: 'text',
          placeholder: 'Subject'
        },
        {
          name: 'content',
          type: 'textarea',
          placeholder: 'Message content'
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
            const receiverId = inputs.find(input => input.checked)?.value;
            
            this.messageForm.patchValue({
              receiverId: receiverId,
              subject: data.subject,
              content: data.content
            });
            
            if (this.messageForm.valid) {
              this.sendMessage();
            } else {
              this.toastService.error('Please complete all fields');
              return false;
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async openReplyForm(message: Message) {
    const receiverId = message.senderId;
    const subject = `RE: ${message.subject || 'No Subject'}`;
    
    const alert = await this.alertController.create({
      header: 'Reply to Message',
      inputs: [
        {
          name: 'content',
          type: 'textarea',
          placeholder: 'Your reply'
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
            this.messageForm.patchValue({
              receiverId: receiverId,
              subject: subject,
              content: data.content
            });
            
            if (data.content && data.content.length >= 5) {
              this.sendMessage();
            } else {
              this.toastService.error('Please enter a message with at least 5 characters');
              return false;
            }
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
          this.toastService.success('Message sent successfully');
          this.messageForm.reset();
          this.loadMessages();
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
  
  async deleteMessage(message: Message, event: Event) {
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
            this.confirmDeleteMessage(message.id);
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
  
  getMessagePreview(content: string, maxLength: number = 60): string {
    if (!content) return '';
    return content.length > maxLength 
      ? `${content.substring(0, maxLength)}...` 
      : content;
  }
  
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  refreshData(event: any) {
    this.loadMessages();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
