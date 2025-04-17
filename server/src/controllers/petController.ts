import { Request, Response } from 'express';
import { db } from '../db/connection';
import { 
  pets, 
  Pet, 
  InsertPet, 
  adoptionApplications,
  InsertAdoptionApplication,
  users,
} from '../models/schema';
import { and, eq, asc, desc, inArray } from 'drizzle-orm';
import { z } from "zod";

export const getAllPets = async (req: Request, res: Response) => {
  try {

    const { status, species, sort } = req.query;
    const StatusEnum = z.enum(["available", "adopted", "pending"]);

    let conditions = [];
    
    const statusParsed = StatusEnum.safeParse(status);
    if (statusParsed.success) {
      conditions.push(eq(pets.status, statusParsed.data));
    }
    
    if (species) {
      conditions.push(eq(pets.species, species as string));
    }
    
    // Start building the query
    let query = db.select().from(pets);
    
    // Apply filters only if conditions exist
    if (conditions.length > 0) {
      query.where(and(...conditions)); // ✅ Correct usage
    }
    if (sort === "newest") {
      query.orderBy(desc(pets.createdAt));
    } else {
      query.orderBy(asc(pets.name));
    }
    
    // Execute query
    const petsList = await query.execute(); // Ensure `.execute()` is called
    
    const petIds = petsList.map((pet) => pet.id);

    const adoptionRecords = await db
      .select({
        petId: adoptionApplications.petId,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(adoptionApplications)
      .innerJoin(users, eq(adoptionApplications.userId, users.id))
      .where(inArray(adoptionApplications.petId, petIds));

    // Group users by petId
    const usersByPetId: Record<string, any[]> = {};
    for (const record of adoptionRecords) {
      if (!usersByPetId[record.petId]) {
        usersByPetId[record.petId] = [];
      }
      usersByPetId[record.petId].push(record.user);
    }

    // Merge users into pet list
    const petsWithUsers = petsList.map((pet) => ({
      ...pet,
      adopters: usersByPetId[pet.id] || [],
    }));
    return res.status(200).json({
      success: true,
      data: petsWithUsers
    });
  } catch (error) {
    console.error('Get all pets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pets2'
    });
  }
};
export const getPetForAdoptionById = async (req: Request, res: Response) => {
  try {
    const petId = parseInt(req.params.id);
    const userId = req.user?.id;
    const [data] = await db.select({
      id: adoptionApplications.id,
      userId: adoptionApplications.userId,
      petId: adoptionApplications.petId,
      status: adoptionApplications.status,
      message: adoptionApplications.message,
      createdAt: adoptionApplications.createdAt,
      updatedAt: adoptionApplications.updatedAt,
      name: pets.name,
      species: pets.species,
      breed: pets.breed,
      age: pets.age,
      gender: pets.gender,
      description: pets.description,
      imageUrl: pets.imageUrl,
      
    })
    .from(adoptionApplications)
    .leftJoin(pets, eq(adoptionApplications.userId, userId!))
    .where(eq(pets.id, petId))
    // const [pet] = await db.select().from(pets).leftJoin(users, eq(adoptionApplications.userId, users.id)).where(eq(pets.id, petId));
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get pet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pet'
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
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    const { name, species, breed, age, gender, description, status } = req.body;

    if (!name || !species || !breed) {
      return res.status(400).json({
        success: false,
        message: "Name, species, and breed are required fields.",
      });
    }

    let imageUrl = null;
    if (req.file && req.file.buffer) {
      imageUrl = req.file.buffer.toString('base64');
    }

    const newPet: InsertPet = {
      name,
      species,
      breed,
      age: age ? parseInt(age) : null,
      gender,
      description,
      imageUrl,
      status: status || "available",
    };

    const [createdPet] = await db.insert(pets).values(newPet).returning();

    return res.status(201).json({
      success: true,
      message: "Pet created successfully",
      data: createdPet,
    });
  } catch (error) {
    console.error("Create pet error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating pet",
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
    if (req.file && req.file.buffer) {
      imageUrl = req.file.buffer.toString('base64');
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
    
    // No need to delete physical files since we're using base64
    
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
    
    if (pet.status !== 'available' && pet.status !== 'pending') {
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
    const StatusEnum = z.enum(["completed", "cancelled","denied", "pending"]);
    let query = db
      .select({
        application: adoptionApplications,
        pet: pets
      })
      .from(adoptionApplications)
      .leftJoin(pets, eq(adoptionApplications.petId, pets.id));
      let conditions = [];
      const statusParsed = StatusEnum.safeParse(status);
    if (statusParsed.success) {
      conditions.push(eq(adoptionApplications.status, statusParsed.data));
    }
    if (conditions.length > 0) {
      query.where(and(...conditions)); 
    }
    const applications = await query.orderBy(desc(adoptionApplications.createdAt));
    console.log(applications)
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
