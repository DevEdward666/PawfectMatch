import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { Pet } from '../../models/pet.model';

@Component({
  selector: 'app-pets',
  templateUrl: './pets.page.html',
  styleUrls: ['./pets.page.scss'],
})
export class PetsPage implements OnInit {
  pets: Pet[] = [];
  filteredPets: Pet[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  
  // Filter options
  selectedStatus: string = 'available';
  selectedSpecies: string = '';
  
  // Available filter options
  statuses: string[] = ['available', 'pending', 'adopted'];
  species: string[] = [];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
  }
  
  ionViewWillEnter() {
    this.loadPets();
  }

  async loadPets() {
    this.loading = true;
    
    try {
      this.apiService.get<any>('pets').subscribe(
        response => {
          if (response.success) {
            this.pets = response.data;
            this.extractFilterOptions();
            this.applyFilters();
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
  
  extractFilterOptions() {
    // Extract unique species for filter
    const uniqueSpecies = new Set<string>();
    this.pets.forEach(pet => {
      if (pet.species) {
        uniqueSpecies.add(pet.species);
      }
    });
    this.species = Array.from(uniqueSpecies);
  }
  
  applyFilters() {
    this.filteredPets = this.pets.filter(pet => {
      // Apply status filter
      if (this.selectedStatus && pet.status !== this.selectedStatus) {
        return false;
      }
      
      // Apply species filter
      if (this.selectedSpecies && pet.species !== this.selectedSpecies) {
        return false;
      }
      
      // Apply search term filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return (
          pet.name.toLowerCase().includes(searchLower) ||
          (pet.breed && pet.breed.toLowerCase().includes(searchLower)) ||
          pet.species.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }
  
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.applyFilters();
  }
  
  onStatusChange(event: any) {
    this.selectedStatus = event.detail.value;
    this.applyFilters();
  }
  
  onSpeciesChange(event: any) {
    this.selectedSpecies = event.detail.value;
    this.applyFilters();
  }
  
  resetFilters() {
    this.searchTerm = '';
    this.selectedStatus = 'available';
    this.selectedSpecies = '';
    this.applyFilters();
  }
  
  navigateToPetDetail(petId: number) {
    this.router.navigate(['/pet-detail', petId]);
  }
  
  refreshPets(event: any) {
    this.loadPets();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
