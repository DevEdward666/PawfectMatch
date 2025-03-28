import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pet, PetForm, AdoptionApplication, AdoptionApplicationForm } from '../models/pet.model';

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private apiUrl = `${environment.apiUrl}/pets`;
  private adoptionUrl = `${environment.apiUrl}/adoptions`;

  constructor(private http: HttpClient) { }

  getAllPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>(this.apiUrl);
  }

  getPetById(id: number): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`);
  }

  createPet(petData: PetForm, image?: File): Observable<Pet> {
    const formData = new FormData();
    
    // Add pet data to form
    Object.keys(petData).forEach(key => {
      formData.append(key, (petData as any)[key]);
    });
    
    // Add image if available
    if (image) {
      formData.append('image', image);
    }
    
    return this.http.post<Pet>(this.apiUrl, formData);
  }

  updatePet(id: number, petData: PetForm, image?: File): Observable<Pet> {
    const formData = new FormData();
    
    // Add pet data to form
    Object.keys(petData).forEach(key => {
      formData.append(key, (petData as any)[key]);
    });
    
    // Add image if available
    if (image) {
      formData.append('image', image);
    }
    
    return this.http.put<Pet>(`${this.apiUrl}/${id}`, formData);
  }

  deletePet(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Adoption application methods
  applyForAdoption(petId: number, application: AdoptionApplicationForm): Observable<AdoptionApplication> {
    return this.http.post<AdoptionApplication>(`${this.apiUrl}/${petId}/adopt`, application);
  }

  getUserApplications(): Observable<AdoptionApplication[]> {
    return this.http.get<AdoptionApplication[]>(`${this.adoptionUrl}/user`);
  }

  getAllApplications(): Observable<AdoptionApplication[]> {
    return this.http.get<AdoptionApplication[]>(this.adoptionUrl);
  }

  updateApplicationStatus(applicationId: number, status: string): Observable<AdoptionApplication> {
    return this.http.put<AdoptionApplication>(`${this.adoptionUrl}/${applicationId}`, { status });
  }
}