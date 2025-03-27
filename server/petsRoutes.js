const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq } = require('drizzle-orm');

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Get pets schema (importing it directly since we don't have a compiled JS version)
const schema = require('../shared/schema');
const { pets } = schema;

// Get all pets
router.get('/', async (req, res) => {
  try {
    const allPets = await db.select().from(pets);
    res.status(200).json({
      success: true,
      data: allPets
    });
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// Get pet by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID'
      });
    }
    
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
});

// Create new pet
router.post('/', async (req, res) => {
  try {
    const { name, species, breed, age, gender, description, imageUrl, status = 'available' } = req.body;
    
    if (!name || !species) {
      return res.status(400).json({
        success: false,
        message: 'Name and species are required'
      });
    }
    
    const [newPet] = await db.insert(pets)
      .values({
        name,
        species,
        breed,
        age,
        gender,
        description,
        imageUrl,
        status
      })
      .returning();
    
    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: newPet
    });
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pet',
      error: error.message
    });
  }
});

// Update pet
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID'
      });
    }
    
    const { name, species, breed, age, gender, description, imageUrl, status } = req.body;
    
    // Check if pet exists
    const [existingPet] = await db.select().from(pets).where(eq(pets.id, id));
    
    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Update pet
    const [updatedPet] = await db.update(pets)
      .set({
        name,
        species,
        breed,
        age,
        gender,
        description,
        imageUrl,
        status,
        updatedAt: new Date()
      })
      .where(eq(pets.id, id))
      .returning();
    
    res.status(200).json({
      success: true,
      message: 'Pet updated successfully',
      data: updatedPet
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pet',
      error: error.message
    });
  }
});

// Delete pet
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID'
      });
    }
    
    // Check if pet exists
    const [existingPet] = await db.select().from(pets).where(eq(pets.id, id));
    
    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Delete pet
    await db.delete(pets).where(eq(pets.id, id));
    
    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pet',
      error: error.message
    });
  }
});

module.exports = router;