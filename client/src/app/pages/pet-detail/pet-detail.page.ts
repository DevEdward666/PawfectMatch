import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Pet } from '../../models/pet.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-pet-detail',
  templateUrl: './pet-detail.page.html',
  styleUrls: ['./pet-detail.page.scss'],
})
export class PetDetailPage implements OnInit {
  petId: number = 0;
  pet: Pet | null = null;
  loading: boolean = true;
  adoptionForm: FormGroup;
  currentUser: User | null = null;
  hasApplied: boolean = false;
  
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
    this.adoptionForm = this.formBuilder.group({
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.petId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    
    if (this.petId) {
      this.loadPetDetails();
    } else {
      this.toastService.error('Invalid pet ID');
      this.router.navigate(['/tabs/pets']);
    }
  }
  
  ionViewWillEnter() {
    this.checkAppliedStatus();
  }

  async loadPetDetails() {
    this.loading = true;
    
    try {
      this.apiService.get<any>(`pets/${this.petId}`).subscribe(
        response => {
          if (response.success) {
            this.pet = response.data;
          } else {
            this.toastService.error('Failed to load pet details');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching pet details:', error);
          this.toastService.error('Failed to load pet details');
          this.loading = false;
          this.router.navigate(['/tabs/pets']);
        }
      );
    } catch (error) {
      console.error('Error loading pet details:', error);
      this.loading = false;
    }
  }
  
  checkAppliedStatus() {
    if (!this.currentUser) return;
    
    this.apiService.get<any>('pets/applications/user').subscribe(
      response => {
        if (response.success) {
          // Check if user has already applied for this pet
          this.hasApplied = response.data.some((app: any) => app.petId === this.petId);
        }
      },
      error => {
        console.error('Error checking application status:', error);
      }
    );
  }
  
  async applyForAdoption() {
    if (this.adoptionForm.invalid) return;
    
    const applicationData = {
      message: this.adoptionForm.value.message
    };
    
    await this.loadingService.show('Submitting application...');
    
    this.apiService.post<any>(`pets/${this.petId}/adopt`, applicationData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Adoption application submitted successfully!');
          this.hasApplied = true;
          this.loadPetDetails(); // Reload pet to see updated status
        } else {
          this.toastService.error(response.message || 'Failed to submit application');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to submit application');
      }
    );
  }
  
  async openAdoptionModal() {
    if (this.pet?.status !== 'available') {
      this.toastService.info('This pet is not currently available for adoption');
      return;
    }
    
    const alert = await this.alertController.create({
      header: `Adopt ${this.pet?.name}`,
      message: 'Please tell us why you would be a good fit for this pet',
      inputs: [
        {
          name: 'message',
          type: 'textarea',
          placeholder: 'Tell us about yourself and your home...'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Submit',
          handler: (data) => {
            if (!data.message || data.message.length < 10) {
              this.toastService.warning('Please provide more information in your application');
              return false;
            }
            
            this.adoptionForm.setValue({ message: data.message });
            this.applyForAdoption();
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  contactShelter() {
    // Navigate to messaging with a pre-filled message about this pet
    this.router.navigate(['/tabs/messages'], { 
      queryParams: { 
        subject: `Inquiry about ${this.pet?.name}`, 
        petId: this.petId 
      } 
    });
  }
  
  goBack() {
    this.router.navigate(['/tabs/pets']);
  }
}
