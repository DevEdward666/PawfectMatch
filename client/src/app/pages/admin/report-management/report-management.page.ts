import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ToastService } from '../../../services/toast.service';
import { Report } from '../../../models/report.model';

@Component({
  selector: 'app-report-management',
  templateUrl: './report-management.page.html',
  styleUrls: ['./report-management.page.scss'],
})
export class ReportManagementPage implements OnInit {
  reports: Report[] = [];
  loading: boolean = true;
  segment: string = 'pending';
  selectedReport: Report | null = null;
  
  // Form for responding to reports
  responseForm: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    this.responseForm = this.formBuilder.group({
      response: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
  }
  
  ionViewWillEnter() {
    this.loadReports();
  }

  async loadReports() {
    this.loading = true;
    
    try {
      const params = this.segment !== 'all' ? { status: this.segment } : {};
      
      this.apiService.get<any>('reports', params).subscribe(
        response => {
          if (response.success) {
            this.reports = response.data;
            // Make sure we have the expanded property for UI
            this.reports.forEach(report => report.expanded = false);
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
    this.loadReports();
  }
  
  toggleReportDetails(report: Report) {
    report.expanded = !report.expanded;
    
    // If expanding and we haven't loaded responses yet
    if (report.expanded && (!report.responses || report.responses.length === 0)) {
      this.loadReportDetails(report);
    }
  }
  
  async loadReportDetails(report: Report) {
    try {
      this.apiService.get<any>(`reports/${report.id}`).subscribe(
        response => {
          if (response.success) {
            // Update the report with the detail data including responses
            const index = this.reports.findIndex(r => r.id === report.id);
            if (index !== -1) {
              // Keep the expanded status
              const wasExpanded = this.reports[index].expanded;
              this.reports[index] = { ...response.data, expanded: wasExpanded };
            }
          }
        },
        error => {
          console.error('Error fetching report details:', error);
        }
      );
    } catch (error) {
      console.error('Error loading report details:', error);
    }
  }
  
  async openResponseForm(report: Report) {
    this.selectedReport = report;
    
    const alert = await this.alertController.create({
      header: `Respond to Report: ${report.title}`,
      inputs: [
        {
          name: 'response',
          type: 'textarea',
          placeholder: 'Your response',
          value: this.responseForm.value.response
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.selectedReport = null;
          }
        },
        {
          text: 'Send Response',
          handler: (data) => {
            this.responseForm.patchValue({
              response: data.response
            });
            
            if (this.responseForm.valid) {
              this.submitResponse();
            } else {
              this.toastService.error('Response must be at least 10 characters');
              return false;
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async submitResponse() {
    if (this.responseForm.invalid || !this.selectedReport) return;
    
    await this.loadingService.show('Sending response...');
    
    const responseData = {
      response: this.responseForm.value.response
    };
    
    this.apiService.post<any>(`reports/${this.selectedReport.id}/respond`, responseData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Response sent successfully');
          this.responseForm.reset();
          this.loadReportDetails(this.selectedReport!);
          
          // Refresh the full list to update statuses
          this.loadReports();
        } else {
          this.toastService.error(response.message || 'Failed to send response');
        }
        
        this.selectedReport = null;
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to send response');
        this.selectedReport = null;
      }
    );
  }
  
  async updateReportStatus(report: Report, status: string) {
    const statusText = status === 'resolved' ? 'mark as resolved' : 'move to reviewing';
    
    const alert = await this.alertController.create({
      header: 'Confirm Status Update',
      message: `Are you sure you want to ${statusText}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: () => {
            this.confirmUpdateStatus(report.id, status);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async confirmUpdateStatus(reportId: number, status: string) {
    await this.loadingService.show('Updating status...');
    
    this.apiService.put<any>(`reports/${reportId}/status`, { status }).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Status updated successfully');
          this.loadReports();
        } else {
          this.toastService.error(response.message || 'Failed to update status');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to update status');
      }
    );
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
  
  refreshData(event: any) {
    this.loadReports();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
