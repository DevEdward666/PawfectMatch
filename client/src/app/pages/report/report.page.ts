import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Report } from '../../models/report.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit {
  reportForm: FormGroup;
  reports: Report[] = [];
  loading: boolean = true;
  segment: string = 'submit';
  currentUser: User | null = null;
  selectedImage: string | null = null;
  imageFile: File | null = null;
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authService: AuthService,
    private actionSheetController: ActionSheetController
  ) {
    this.reportForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      location: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
  
  ionViewWillEnter() {
    this.loadReports();
  }

  async loadReports() {
    this.loading = true;
    
    try {
      this.apiService.get<any>('reports/user').subscribe(
        response => {
          if (response.success) {
            this.reports = response.data;
          } else {
            this.toastService.error('Failed to load reports');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching reports:', error);
          this.toastService.error('Failed to load reports');
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading reports:', error);
      this.loading = false;
    }
  }
  
  segmentChanged(event: any) {
    this.segment = event.detail.value;
  }
  
  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera',
          handler: () => {
            this.takePicture(CameraSource.Camera);
          }
        },
        {
          text: 'Choose from Gallery',
          icon: 'image',
          handler: () => {
            this.takePicture(CameraSource.Photos);
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    
    await actionSheet.present();
  }
  
  async takePicture(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: source
      });
      
      // Display the image preview
      this.selectedImage = image.webPath;
      
      // Convert to blob for upload
      const response = await fetch(image.webPath!);
      const blob = await response.blob();
      this.imageFile = new File([blob], `image.${image.format}`, { type: `image/${image.format}` });
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }
  
  async submitReport() {
    if (this.reportForm.invalid) return;
    
    await this.loadingService.show('Submitting report...');
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('title', this.reportForm.value.title);
    formData.append('description', this.reportForm.value.description);
    formData.append('location', this.reportForm.value.location);
    
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    
    this.apiService.upload<any>('reports', formData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Report submitted successfully!');
          this.reportForm.reset();
          this.selectedImage = null;
          this.imageFile = null;
          this.segment = 'history';
          this.loadReports();
        } else {
          this.toastService.error(response.message || 'Failed to submit report');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to submit report');
      }
    );
  }
  
  viewReportDetail(report: Report) {
    // Display report details in a modal or navigate to a detail page
    // For simplicity, we'll just toggle expanded view
    report.expanded = !report.expanded;
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewing':
        return 'primary';
      case 'resolved':
        return 'success';
      default:
        return 'medium';
    }
  }
  
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  refreshReports(event: any) {
    this.loadReports();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}

// Add the expanded property to Report interface
declare module '../../models/report.model' {
  interface Report {
    expanded?: boolean;
  }
}
