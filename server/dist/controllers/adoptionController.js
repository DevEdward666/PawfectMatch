"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdoptionApplication = exports.updateAdoptionApplication = exports.createNewAdoptionApplication = exports.getAdoptionApplication = exports.getuserAdoptionApplication = exports.getAllAdoption = void 0;
const connection_1 = require("../db/connection");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const getAllAdoption = async (req, res) => {
    console.log(res);
    try {
        const applications = await connection_1.db.select({
            id: schema_1.adoptionApplications.id,
            userId: schema_1.adoptionApplications.userId,
            petId: schema_1.adoptionApplications.petId,
            status: schema_1.adoptionApplications.status,
            message: schema_1.adoptionApplications.message,
            createdAt: schema_1.adoptionApplications.createdAt,
            updatedAt: schema_1.adoptionApplications.updatedAt,
            petName: schema_1.pets.name,
            petSpecies: schema_1.pets.species,
            petBreed: schema_1.pets.breed,
            userName: schema_1.users.name,
            userEmail: schema_1.users.email
        })
            .from(schema_1.adoptionApplications)
            .leftJoin(schema_1.pets, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, schema_1.pets.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.userId, schema_1.users.id));
        res.status(200).json({
            success: true,
            data: applications
        });
    }
    catch (error) {
        console.error('Error fetching adoption applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching adoption applications',
            error: error.message
        });
    }
};
exports.getAllAdoption = getAllAdoption;
const getuserAdoptionApplication = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const applications = await connection_1.db.select({
            id: schema_1.adoptionApplications.id,
            userId: schema_1.adoptionApplications.userId,
            petId: schema_1.adoptionApplications.petId,
            status: schema_1.adoptionApplications.status,
            message: schema_1.adoptionApplications.message,
            createdAt: schema_1.adoptionApplications.createdAt,
            updatedAt: schema_1.adoptionApplications.updatedAt,
            petName: schema_1.pets.name,
            petSpecies: schema_1.pets.species,
            petBreed: schema_1.pets.breed,
            petImageUrl: schema_1.pets.imageUrl
        })
            .from(schema_1.adoptionApplications)
            .leftJoin(schema_1.pets, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, schema_1.pets.id))
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.userId, userId));
        res.status(200).json({
            success: true,
            data: applications
        });
    }
    catch (error) {
        console.error('Error fetching user adoption applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user adoption applications',
            error: error.message
        });
    }
};
exports.getuserAdoptionApplication = getuserAdoptionApplication;
const getAdoptionApplication = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID'
            });
        }
        const [application] = await connection_1.db.select({
            id: schema_1.adoptionApplications.id,
            userId: schema_1.adoptionApplications.userId,
            petId: schema_1.adoptionApplications.petId,
            status: schema_1.adoptionApplications.status,
            message: schema_1.adoptionApplications.message,
            createdAt: schema_1.adoptionApplications.createdAt,
            updatedAt: schema_1.adoptionApplications.updatedAt,
            petName: schema_1.pets.name,
            petSpecies: schema_1.pets.species,
            petBreed: schema_1.pets.breed,
            petImageUrl: schema_1.pets.imageUrl,
            userName: schema_1.users.name,
            userEmail: schema_1.users.email
        })
            .from(schema_1.adoptionApplications)
            .leftJoin(schema_1.pets, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, schema_1.pets.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.id, id));
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
    }
    catch (error) {
        console.error('Error fetching adoption application:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching adoption application',
            error: error.message
        });
    }
};
exports.getAdoptionApplication = getAdoptionApplication;
const createNewAdoptionApplication = async (req, res) => {
    try {
        const { userId, petId, message } = req.body;
        if (!userId || !petId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and pet ID are required'
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
        // Check if user already applied for this pet
        const [existingApplication] = await connection_1.db.select()
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, petId)));
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to adopt this pet'
            });
        }
        // Create application
        const [newApplication] = await connection_1.db.insert(schema_1.adoptionApplications)
            .values({
            userId,
            petId,
            message,
            status: 'pending'
        })
            .returning();
        // Update pet status to pending
        await connection_1.db.update(schema_1.pets)
            .set({ status: 'pending', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.pets.id, petId));
        res.status(201).json({
            success: true,
            message: 'Adoption application submitted successfully',
            data: newApplication
        });
    }
    catch (error) {
        console.error('Error creating adoption application:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating adoption application',
            error: error.message
        });
    }
};
exports.createNewAdoptionApplication = createNewAdoptionApplication;
const updateAdoptionApplication = async (req, res) => {
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
        const [existingApplication] = await connection_1.db.select()
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.id, id));
        if (!existingApplication) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        // Update application
        const [updatedApplication] = await connection_1.db.update(schema_1.adoptionApplications)
            .set({
            status,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.id, id))
            .returning();
        // If approved, update pet status to adopted
        if (status === 'approved') {
            await connection_1.db.update(schema_1.pets)
                .set({
                status: 'adopted',
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.pets.id, existingApplication.petId));
            // Reject all other applications for this pet
            await connection_1.db.update(schema_1.adoptionApplications)
                .set({
                status: 'rejected',
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, existingApplication.petId), (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.id, id) // Not the current application
            ));
        }
        // If rejected but was the only pending application, set pet back to available
        if (status === 'rejected') {
            const [pendingCount] = await connection_1.db.select({
                count: (0, drizzle_orm_1.sql) `COUNT(*)`
            })
                .from(schema_1.adoptionApplications)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, existingApplication.petId), (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.status, 'pending')));
            console.log(pendingCount);
            if (pendingCount.count === 0) {
                await connection_1.db.update(schema_1.pets)
                    .set({
                    status: 'available',
                    updatedAt: new Date()
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.pets.id, existingApplication.petId));
            }
        }
        res.status(200).json({
            success: true,
            message: 'Application status updated successfully',
            data: updatedApplication
        });
    }
    catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating application status',
            error: error.message
        });
    }
};
exports.updateAdoptionApplication = updateAdoptionApplication;
const deleteAdoptionApplication = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID'
            });
        }
        // Check if application exists
        const [existingApplication] = await connection_1.db.select()
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.id, id));
        if (!existingApplication) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        // Delete application
        await connection_1.db.delete(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.id, id));
        // Check if there are other pending applications for this pet
        const [pendingCount] = await connection_1.db.select({
            count: (0, drizzle_orm_1.sql) `COUNT(*)`
        })
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, existingApplication.petId), (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.status, 'pending')));
        // If no pending applications, set pet status back to available
        if (pendingCount.count === 0) {
            await connection_1.db.update(schema_1.pets)
                .set({
                status: 'available',
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.pets.id, existingApplication.petId));
        }
        res.status(200).json({
            success: true,
            message: 'Application deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting application',
            error: error.message
        });
    }
};
exports.deleteAdoptionApplication = deleteAdoptionApplication;
