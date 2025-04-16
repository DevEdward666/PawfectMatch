"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdoptionApplication = exports.getAllAdoptionApplications = exports.getUserAdoptionApplications = exports.applyForAdoption = exports.deletePet = exports.updatePet = exports.createPet = exports.getPetById = exports.getAllPets = void 0;
const connection_1 = require("../db/connection");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const getAllPets = async (req, res) => {
    try {
        const { status, species, sort } = req.query;
        const StatusEnum = zod_1.z.enum(["available", "adopted", "pending"]);
        let conditions = [];
        const statusParsed = StatusEnum.safeParse(status);
        if (statusParsed.success) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.pets.status, statusParsed.data));
        }
        if (species) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.pets.species, species));
        }
        // Start building the query
        let query = connection_1.db.select().from(schema_1.pets);
        // Apply filters only if conditions exist
        if (conditions.length > 0) {
            query.where((0, drizzle_orm_1.and)(...conditions)); // ✅ Correct usage
        }
        if (sort === "newest") {
            query.orderBy((0, drizzle_orm_1.desc)(schema_1.pets.createdAt));
        }
        else {
            query.orderBy((0, drizzle_orm_1.asc)(schema_1.pets.name));
        }
        // Execute query
        const petsList = await query.execute(); // Ensure `.execute()` is called
        return res.status(200).json({
            success: true,
            data: petsList
        });
    }
    catch (error) {
        console.error('Get all pets error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching pets2'
        });
    }
};
exports.getAllPets = getAllPets;
const getPetById = async (req, res) => {
    try {
        const petId = parseInt(req.params.id);
        const [pet] = await connection_1.db.select().from(schema_1.pets).where((0, drizzle_orm_1.eq)(schema_1.pets.id, petId));
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
    }
    catch (error) {
        console.error('Get pet error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching pet'
        });
    }
};
exports.getPetById = getPetById;
const createPet = async (req, res) => {
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
        const newPet = {
            name,
            species,
            breed,
            age: age ? parseInt(age) : null,
            gender,
            description,
            imageUrl,
            status: status || "available",
        };
        const [createdPet] = await connection_1.db.insert(schema_1.pets).values(newPet).returning();
        return res.status(201).json({
            success: true,
            message: "Pet created successfully",
            data: createdPet,
        });
    }
    catch (error) {
        console.error("Create pet error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while creating pet",
        });
    }
};
exports.createPet = createPet;
const updatePet = async (req, res) => {
    try {
        const petId = parseInt(req.params.id);
        const { name, species, breed, age, gender, description, status } = req.body;
        // Check if pet exists
        const [existingPet] = await connection_1.db.select().from(schema_1.pets).where((0, drizzle_orm_1.eq)(schema_1.pets.id, petId));
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
        const [updatedPet] = await connection_1.db
            .update(schema_1.pets)
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
            .where((0, drizzle_orm_1.eq)(schema_1.pets.id, petId))
            .returning();
        return res.status(200).json({
            success: true,
            message: 'Pet updated successfully',
            data: updatedPet
        });
    }
    catch (error) {
        console.error('Update pet error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating pet'
        });
    }
};
exports.updatePet = updatePet;
const deletePet = async (req, res) => {
    try {
        const petId = parseInt(req.params.id);
        // Check if pet exists
        const [existingPet] = await connection_1.db.select().from(schema_1.pets).where((0, drizzle_orm_1.eq)(schema_1.pets.id, petId));
        if (!existingPet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        // No need to delete physical files since we're using base64
        // Delete pet
        await connection_1.db.delete(schema_1.pets).where((0, drizzle_orm_1.eq)(schema_1.pets.id, petId));
        return res.status(200).json({
            success: true,
            message: 'Pet deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete pet error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting pet'
        });
    }
};
exports.deletePet = deletePet;
// Adoption Applications
const applyForAdoption = async (req, res) => {
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
        const [pet] = await connection_1.db.select().from(schema_1.pets).where((0, drizzle_orm_1.eq)(schema_1.pets.id, petId));
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
        const existingApplication = await connection_1.db
            .select()
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, petId)));
        if (existingApplication.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to adopt this pet'
            });
        }
        // Create adoption application
        const application = {
            userId,
            petId,
            message,
            status: 'pending'
        };
        const [createdApplication] = await connection_1.db
            .insert(schema_1.adoptionApplications)
            .values(application)
            .returning();
        // Update pet status to pending
        await connection_1.db
            .update(schema_1.pets)
            .set({ status: 'pending', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.pets.id, petId));
        return res.status(201).json({
            success: true,
            message: 'Adoption application submitted successfully',
            data: createdApplication
        });
    }
    catch (error) {
        console.error('Apply for adoption error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while submitting adoption application'
        });
    }
};
exports.applyForAdoption = applyForAdoption;
const getUserAdoptionApplications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Get user's applications with pet info
        const applications = await connection_1.db
            .select({
            application: schema_1.adoptionApplications,
            pet: schema_1.pets
        })
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.userId, userId))
            .leftJoin(schema_1.pets, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, schema_1.pets.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.adoptionApplications.createdAt));
        // Format the result
        const formattedApplications = applications.map(({ application, pet }) => ({
            ...application,
            pet
        }));
        return res.status(200).json({
            success: true,
            data: formattedApplications
        });
    }
    catch (error) {
        console.error('Get user applications error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching adoption applications'
        });
    }
};
exports.getUserAdoptionApplications = getUserAdoptionApplications;
// Admin controllers
const getAllAdoptionApplications = async (req, res) => {
    try {
        const { status } = req.query;
        const StatusEnum = zod_1.z.enum(["completed", "cancelled", "denied", "pending"]);
        let query = connection_1.db
            .select({
            application: schema_1.adoptionApplications,
            pet: schema_1.pets
        })
            .from(schema_1.adoptionApplications)
            .leftJoin(schema_1.pets, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, schema_1.pets.id));
        let conditions = [];
        const statusParsed = StatusEnum.safeParse(status);
        if (statusParsed.success) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.status, statusParsed.data));
        }
        if (conditions.length > 0) {
            query.where((0, drizzle_orm_1.and)(...conditions));
        }
        const applications = await query.orderBy((0, drizzle_orm_1.desc)(schema_1.adoptionApplications.createdAt));
        console.log(applications);
        // Format the result
        const formattedApplications = applications.map(({ application, pet }) => ({
            ...application,
            pet
        }));
        return res.status(200).json({
            success: true,
            data: formattedApplications
        });
    }
    catch (error) {
        console.error('Get all applications error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching adoption applications'
        });
    }
};
exports.getAllAdoptionApplications = getAllAdoptionApplications;
const updateAdoptionApplication = async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        const { status } = req.body;
        // Check if application exists
        const [application] = await connection_1.db
            .select()
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.id, applicationId));
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Adoption application not found'
            });
        }
        // Update application status
        const [updatedApplication] = await connection_1.db
            .update(schema_1.adoptionApplications)
            .set({
            status,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.id, applicationId))
            .returning();
        // Update pet status based on application status
        if (status === 'approved') {
            await connection_1.db
                .update(schema_1.pets)
                .set({
                status: 'adopted',
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.pets.id, application.petId));
        }
        else if (status === 'rejected') {
            await connection_1.db
                .update(schema_1.pets)
                .set({
                status: 'available',
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.pets.id, application.petId));
        }
        return res.status(200).json({
            success: true,
            message: 'Adoption application updated successfully',
            data: updatedApplication
        });
    }
    catch (error) {
        console.error('Update application error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating adoption application'
        });
    }
};
exports.updateAdoptionApplication = updateAdoptionApplication;
