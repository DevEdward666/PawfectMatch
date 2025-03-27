import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ToastService } from '../../../services/toast.service';
import { Pet, AdoptionApplication } from '../../../models/pet.model';

@Component({
  selector: 'app-pet-management',
  templateUrl: './pet-management.page.html',
  styleUrls: ['./pet-management.page.scss'],
})
export class PetManagementPage implements OnInit {
  pets: Pet[] = [];
  applications: AdoptionApplication[] = [];
  loading: boolean = true;
  segment: string = 'all';
  searchTerm: string = '';
  
  // Form for adding/editing pets
  petForm: FormGroup;
  isEditMode: boolean = false;
  currentPetId: number | null = null;
  selectedImage: string | null = null;
  imageFile: File | null = null;
  
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private alertController: AlertController,
    private modalController: ModalController
  ) {
    this.petForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      species: ['', Validators.required],
      breed: [''],
      age: [null],
      gender: [''],
      description: [''],
      status: ['available', Validators.required]
    });
  }

  ngOnInit() {
  }
  
  ionViewWillEnter() {
    this.loadPets();
    this.loadAdoptionApplications();
  }

  async loadPets() {
    this.loading = true;
    
    try {
      this.apiService.get<any>('pets').subscribe(
        response => {
          if (response.success) {
            this.pets = response.data;
          } else {
            this.toastService.error('Failed to load pets');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching pets:', error);
          this.toastService.error('Failed to load pets');
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading pets:', error);
      this.loading = false;
    }
  }
  
  async loadAdoptionApplications() {
    try {
      this.apiService.get<any>('pets/applications/all').subscribe(
        response => {
          if (response.success) {
            this.applications = response.data;
          } else {
            this.toastService.error('Failed to load adoption applications');
          }
        },
        error => {
          console.error('Error fetching adoption applications:', error);
          this.toastService.error('Failed to load adoption applications');
        }
      );
    } catch (error) {
      console.error('Error loading adoption applications:', error);
    }
  }
  
  segmentChanged(event: any) {
    this.segment = event.detail.value;
  }
  
  async selectImage() {
    const actionSheet = await this.alertController.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Take Photo',
          handler: () => {
            this.takePicture(CameraSource.Camera);
          }
        },
        {
          text: 'Choose from Gallery',
          handler: () => {
            this.takePicture(CameraSource.Photos);
          }
        },
        {
          text: 'Cancel',
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
  
  async openPetForm(pet?: Pet) {
    if (pet) {
      // Edit mode
      this.isEditMode = true;
      this.currentPetId = pet.id;
      this.petForm.patchValue({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        age: pet.age || null,
        gender: pet.gender || '',
        description: pet.description || '',
        status: pet.status
      });
      this.selectedImage = pet.imageUrl || null;
    } else {
      // Add mode
      this.isEditMode = false;
      this.currentPetId = null;
      this.petForm.reset({
        status: 'available'
      });
      this.selectedImage = null;
      this.imageFile = null;
    }
    
    const alert = await this.alertController.create({
      header: this.isEditMode ? 'Edit Pet' : 'Add New Pet',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Pet Name',
          value: this.petForm.value.name
        },
        {
          name: 'species',
          type: 'text',
          placeholder: 'Species (e.g., Dog, Cat)',
          value: this.petForm.value.species
        },
        {
          name: 'breed',
          type: 'text',
          placeholder: 'Breed (optional)',
          value: this.petForm.value.breed
        },
        {
          name: 'age',
          type: 'number',
          placeholder: 'Age in years (optional)',
          value: this.petForm.value.age
        },
        {
          name: 'gender',
          type: 'text',
          placeholder: 'Gender (optional)',
          value: this.petForm.value.gender
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optional)',
          value: this.petForm.value.description
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: this.isEditMode ? 'Update' : 'Add',
          handler: (data) => {
            this.petForm.patchValue({
              name: data.name,
              species: data.species,
              breed: data.breed,
              age: data.age,
              gender: data.gender,
              description: data.description
            });
            
            if (this.petForm.valid) {
              if (this.isEditMode) {
                this.updatePet();
              } else {
                this.addPet();
              }
            } else {
              this.toastService.error('Please complete all required fields');
              return false;
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async addPet() {
    if (this.petForm.invalid) return;
    
    await this.loadingService.show('Adding pet...');
    
    const formData = new FormData();
    formData.append('name', this.petForm.value.name);
    formData.append('species', this.petForm.value.species);
    formData.append('breed', this.petForm.value.breed || '');
    formData.append('age', this.petForm.value.age || '');
    formData.append('gender', this.petForm.value.gender || '');
    formData.append('description', this.petForm.value.description || '');
    formData.append('status', this.petForm.value.status);
    
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    
    this.apiService.upload<any>('pets', formData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Pet added successfully');
          this.petForm.reset();
          this.selectedImage = null;
          this.imageFile = null;
          this.loadPets();
        } else {
          this.toastService.error(response.message || 'Failed to add pet');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to add pet');
      }
    );
  }
  
  async updatePet() {
    if (this.petForm.invalid || !this.currentPetId) return;
    
    await this.loadingService.show('Updating pet...');
    
    const formData = new FormData();
    formData.append('name', this.petForm.value.name);
    formData.append('species', this.petForm.value.species);
    formData.append('breed', this.petForm.value.breed || '');
    formData.append('age', this.petForm.value.age || '');
    formData.append('gender', this.petForm.value.gender || '');
    formData.append('description', this.petForm.value.description || '');
    formData.append('status', this.petForm.value.status);
    
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    
    this.apiService.updateWithFile<any>(`pets/${this.currentPetId}`, formData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Pet updated successfully');
          this.petForm.reset();
          this.selectedImage = null;
          this.imageFile = null;
          this.currentPetId = null;
          this.loadPets();
        } else {
          this.toastService.error(response.message || 'Failed to update pet');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to update pet');
      }
    );
  }
  
  async deletePet(pet: Pet) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${pet.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.confirmDeletePet(pet.id);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async confirmDeletePet(petId: number) {
    await this.loadingService.show('Deleting pet...');
    
    this.apiService.delete<any>(`pets/${petId}`).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Pet deleted successfully');
          this.loadPets();
        } else {
          this.toastService.error(response.message || 'Failed to delete pet');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to delete pet');
      }
    );
  }
  
  async updateApplicationStatus(application: AdoptionApplication, status: string) {
    const alert = await this.alertController.create({
      header: 'Confirm Action',
      message: `Are you sure you want to ${status} this adoption application?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: () => {
            this.confirmUpdateApplicationStatus(application.id, status);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async confirmUpdateApplicationStatus(applicationId: number, status: string) {
    await this.loadingService.show('Updating application...');
    
    this.apiService.put<any>(`pets/applications/${applicationId}`, { status }).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success(`Application ${status} successfully`);
          this.loadAdoptionApplications();
          this.loadPets();
        } else {
          this.toastService.error(response.message || 'Failed to update application');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to update application');
      }
    );
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'success';
      case 'adopted':
        return 'medium';
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  }
  
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  
  onSearch(event: any) {
    this.searchTerm = event.detail.value;
  }
  
  filterPets(): Pet[] {
    if (!this.searchTerm) {
      return this.pets;
    }
    
    const searchTerm = this.searchTerm.toLowerCase();
    return this.pets.filter(pet => 
      pet.name.toLowerCase().includes(searchTerm) ||
      pet.species.toLowerCase().includes(searchTerm) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchTerm))
    );
  }
  
  filterApplications(): AdoptionApplication[] {
    return this.applications;
  }
  
  refreshData(event: any) {
    this.loadPets();
    this.loadAdoptionApplications();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
