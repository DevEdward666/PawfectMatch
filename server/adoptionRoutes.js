const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq, and } = require('drizzle-orm');

// Database connection
const pool = new Pool({   connectionString: process.env.DATABASE_URL + '?sslmode=require'});
const db = drizzle(pool);

// Get schema
const schema = require('../shared/schema');
const { adoptionApplications, pets, users } = schema;

// Get all adoption applications (admin only, to be protected with middleware later)
router.get('/all', async (req, res) => {
  console.log(res)
  try {
    const applications = await db.select({
      id: adoptionApplications.id,
      userId: adoptionApplications.userId,
      petId: adoptionApplications.petId,
      status: adoptionApplications.status,
      message: adoptionApplications.message,
      createdAt: adoptionApplications.createdAt,
      updatedAt: adoptionApplications.updatedAt,
      petName: pets.name,
      petSpecies: pets.species,
      petBreed: pets.breed,
      userName: users.name,
      userEmail: users.email
    })
    .from(adoptionApplications)
    .leftJoin(pets, eq(adoptionApplications.petId, pets.id))
    .leftJoin(users, eq(adoptionApplications.userId, users.id));
    
    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching adoption applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching adoption applications',
      error: error.message
    });
  }
});

// Get applications by user ID (to be protected with authentication middleware later)
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const applications = await db.select({
      id: adoptionApplications.id,
      userId: adoptionApplications.userId,
      petId: adoptionApplications.petId,
      status: adoptionApplications.status,
      message: adoptionApplications.message,
      createdAt: adoptionApplications.createdAt,
      updatedAt: adoptionApplications.updatedAt,
      petName: pets.name,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petImageUrl: pets.imageUrl
    })
    .from(adoptionApplications)
    .leftJoin(pets, eq(adoptionApplications.petId, pets.id))
    .where(eq(adoptionApplications.userId, userId));
    
    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching user adoption applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user adoption applications',
      error: error.message
    });
  }
});

// Get application by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }
    
    const [application] = await db.select({
      id: adoptionApplications.id,
      userId: adoptionApplications.userId,
      petId: adoptionApplications.petId,
      status: adoptionApplications.status,
      message: adoptionApplications.message,
      createdAt: adoptionApplications.createdAt,
      updatedAt: adoptionApplications.updatedAt,
      petName: pets.name,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petImageUrl: pets.imageUrl,
      userName: users.name,
      userEmail: users.email
    })
    .from(adoptionApplications)
    .leftJoin(pets, eq(adoptionApplications.petId, pets.id))
    .leftJoin(users, eq(adoptionApplications.userId, users.id))
    .where(eq(adoptionApplications.id, id));
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching adoption application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching adoption application',
      error: error.message
    });
  }
});

// Create new adoption application
router.post('/', async (req, res) => {
  try {
    const { userId, petId, message } = req.body;
    
    if (!userId || !petId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and pet ID are required'
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
    
    // Check if user already applied for this pet
    const [existingApplication] = await db.select()
      .from(adoptionApplications)
      .where(
        and(
          eq(adoptionApplications.userId, userId),
          eq(adoptionApplications.petId, petId)
        )
      );
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to adopt this pet'
      });
    }
    
    // Create application
    const [newApplication] = await db.insert(adoptionApplications)
      .values({
        userId,
        petId,
        message,
        status: 'pending'
      })
      .returning();
    
    // Update pet status to pending
    await db.update(pets)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(eq(pets.id, petId));
    
    res.status(201).json({
      success: true,
      message: 'Adoption application submitted successfully',
      data: newApplication
    });
  } catch (error) {
    console.error('Error creating adoption application:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating adoption application',
      error: error.message
    });
  }
});

// Update application status (admin only, to be protected with middleware later)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }
    
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, or rejected)'
      });
    }
    
    // Check if application exists
    const [existingApplication] = await db.select()
      .from(adoptionApplications)
      .where(eq(adoptionApplications.id, id));
    
    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update application
    const [updatedApplication] = await db.update(adoptionApplications)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(adoptionApplications.id, id))
      .returning();
    
    // If approved, update pet status to adopted
    if (status === 'approved') {
      await db.update(pets)
        .set({
          status: 'adopted',
          updatedAt: new Date()
        })
        .where(eq(pets.id, existingApplication.petId));
      
      // Reject all other applications for this pet
      await db.update(adoptionApplications)
        .set({
          status: 'rejected',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(adoptionApplications.petId, existingApplication.petId),
            eq(adoptionApplications.id, id, true) // Not the current application
          )
        );
    }
    
    // If rejected but was the only pending application, set pet back to available
    if (status === 'rejected') {
      const [pendingCount] = await db.select({
      count: sql`COUNT(*)`
      })
      .from(adoptionApplications)
      .where(
        and(
          eq(adoptionApplications.petId, existingApplication.petId),
          eq(adoptionApplications.status, 'pending')
        )
      );
      
      if (pendingCount.count === 0) {
        await db.update(pets)
          .set({
            status: 'available',
            updatedAt: new Date()
          })
          .where(eq(pets.id, existingApplication.petId));
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
});

// Delete application (rarely used, but included for completeness)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }
    
    // Check if application exists
    const [existingApplication] = await db.select()
      .from(adoptionApplications)
      .where(eq(adoptionApplications.id, id));
    
    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Delete application
    await db.delete(adoptionApplications)
      .where(eq(adoptionApplications.id, id));
    
    // Check if there are other pending applications for this pet
    const [pendingCount] = await db.select({
    count: sql`COUNT(*)`
    })
    .from(adoptionApplications)
    .where(
      and(
        eq(adoptionApplications.petId, existingApplication.petId),
        eq(adoptionApplications.status, 'pending')
      )
    );
    
    // If no pending applications, set pet status back to available
    if (pendingCount.count === 0) {
      await db.update(pets)
        .set({
          status: 'available',
          updatedAt: new Date()
        })
        .where(eq(pets.id, existingApplication.petId));
    }
    
    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error.message
    });
  }
});

module.exports = router;