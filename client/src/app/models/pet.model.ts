export interface Pet {
  id: number;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  gender?: string;
  description?: string;
  imageUrl?: string;
  status: 'available' | 'adopted' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface PetForm {
  name: string;
  species: string;
  breed?: string;
  age?: number;
  gender?: string;
  description?: string;
  status?: 'available' | 'adopted' | 'pending';
}

export interface AdoptionApplication {
  id: number;
  userId: number;
  petId: number;
  status: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  pet?: Pet;
}

export interface AdoptionApplicationForm {
  message: string;
}
