import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  pets, 
  Pet, 
  InsertPet, 
  adoptionApplications,
  InsertAdoptionApplication 
} from '../models/schema';
import { eq, asc, desc, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const getAllPets = async (req: Request, res: Response) => {
  try {
    const { status, species, sort } = req.query;
    
    let query = db.select().from(pets);
    
    // Apply filters
    if (status) {
      query = query.where(eq(pets.status, status as string));
    }
    
    if (species) {
      query = query.where(eq(pets.species, species as string));
    }
    
    // Apply sorting
    if (sort === 'newest') {
      query = query.orderBy(desc(pets.createdAt));
    } else {
      query = query.orderBy(asc(pets.name));
    }
    
    const petsList = await query;
    
    return res.status(200).json({
      success: true,
      data: petsList
    });
  } catch (error) {
    console.error('Get all pets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pets'
    });
  }
};

export const getPetById = async (req: Request, res: Response) => {
  try {
    const petId = parseInt(req.params.id);
    
    const [pet] = await db.select().from(pets).where(eq(pets.id, petId));
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('Get pet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pet'
    });
  }
};

export const createPet = async (req: Request, res: Response) => {
  try {
    const { name, species, breed, age, gender, description, status } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      // Create a relative URL for the image
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const newPet: InsertPet = {
      name,
      species,
      breed,
      age: age ? parseInt(age) : null,
      gender,
      description,
      imageUrl,
      status: status || 'available'
    };
    
    const [createdPet] = await db.insert(pets).values(newPet).returning();
    
    return res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: createdPet
    });
  } catch (error) {
    console.error('Create pet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating pet'
    });
  }
};

export const updatePet = async (req: Request, res: Response) => {
  try {
    const petId = parseInt(req.params.id);
    const { name, species, breed, age, gender, description, status } = req.body;
    
    // Check if pet exists
    const [existingPet] = await db.select().from(pets).where(eq(pets.id, petId));
    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Handle image upload if provided
    let imageUrl = existingPet.imageUrl;
    if (req.file) {
      // If there's an existing image, delete it
      if (existingPet.imageUrl) {
        const oldImagePath = path.join(__dirname, '../..', existingPet.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Set new image URL
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    // Update pet
    const [updatedPet] = await db
      .update(pets)
      .set({
        name,
        species,
        breed,
        age: age ? parseInt(age) : null,
        gender,
        description,
        imageUrl,
        status,
        updatedAt: new Date()
      })
      .where(eq(pets.id, petId))
      .returning();
    
    return res.status(200).json({
      success: true,
      message: 'Pet updated successfully',
      data: updatedPet
    });
  } catch (error) {
    console.error('Update pet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating pet'
    });
  }
};

export const deletePet = async (req: Request, res: Response) => {
  try {
    const petId = parseInt(req.params.id);
    
    // Check if pet exists
    const [existingPet] = await db.select().from(pets).where(eq(pets.id, petId));
    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Delete image if exists
    if (existingPet.imageUrl) {
      const imagePath = path.join(__dirname, '../..', existingPet.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete pet
    await db.delete(pets).where(eq(pets.id, petId));
    
    return res.status(200).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting pet'
    });
  }
};

// Adoption Applications

export const applyForAdoption = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const petId = parseInt(req.params.id);
    const { message } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Check if pet exists and is available
    const [pet] = await db.select().from(pets).where(eq(pets.id, petId));
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    if (pet.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Pet is not available for adoption'
      });
    }
    
    // Check if user already has an application for this pet
    const existingApplication = await db
      .select()
      .from(adoptionApplications)
      .where(
        and(
          eq(adoptionApplications.userId, userId),
          eq(adoptionApplications.petId, petId)
        )
      );
    
    if (existingApplication.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to adopt this pet'
      });
    }
    
    // Create adoption application
    const application: InsertAdoptionApplication = {
      userId,
      petId,
      message,
      status: 'pending'
    };
    
    const [createdApplication] = await db
      .insert(adoptionApplications)
      .values(application)
      .returning();
    
    // Update pet status to pending
    await db
      .update(pets)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(eq(pets.id, petId));
    
    return res.status(201).json({
      success: true,
      message: 'Adoption application submitted successfully',
      data: createdApplication
    });
  } catch (error) {
    console.error('Apply for adoption error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting adoption application'
    });
  }
};

export const getUserAdoptionApplications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Get user's applications with pet info
    const applications = await db
      .select({
        application: adoptionApplications,
        pet: pets
      })
      .from(adoptionApplications)
      .where(eq(adoptionApplications.userId, userId))
      .leftJoin(pets, eq(adoptionApplications.petId, pets.id))
      .orderBy(desc(adoptionApplications.createdAt));
    
    // Format the result
    const formattedApplications = applications.map(({ application, pet }) => ({
      ...application,
      pet
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Get user applications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching adoption applications'
    });
  }
};

// Admin controllers

export const getAllAdoptionApplications = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    let query = db
      .select({
        application: adoptionApplications,
        pet: pets
      })
      .from(adoptionApplications)
      .leftJoin(pets, eq(adoptionApplications.petId, pets.id));
    
    // Apply status filter if provided
    if (status) {
      query = query.where(eq(adoptionApplications.status, status as string));
    }
    
    const applications = await query.orderBy(desc(adoptionApplications.createdAt));
    
    // Format the result
    const formattedApplications = applications.map(({ application, pet }) => ({
      ...application,
      pet
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching adoption applications'
    });
  }
};

export const updateAdoptionApplication = async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Check if application exists
    const [application] = await db
      .select()
      .from(adoptionApplications)
      .where(eq(adoptionApplications.id, applicationId));
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Adoption application not found'
      });
    }
    
    // Update application status
    const [updatedApplication] = await db
      .update(adoptionApplications)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(adoptionApplications.id, applicationId))
      .returning();
    
    // Update pet status based on application status
    if (status === 'approved') {
      await db
        .update(pets)
        .set({
          status: 'adopted',
          updatedAt: new Date()
        })
        .where(eq(pets.id, application.petId));
    } else if (status === 'rejected') {
      await db
        .update(pets)
        .set({
          status: 'available',
          updatedAt: new Date()
        })
        .where(eq(pets.id, application.petId));
    }
    
    return res.status(200).json({
      success: true,
      message: 'Adoption application updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Update application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating adoption application'
    });
  }
};
