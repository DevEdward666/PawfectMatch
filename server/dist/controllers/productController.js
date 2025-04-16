"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const connection_1 = require("../db/connection");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const getAllProducts = async (req, res) => {
    try {
        const { category, search, sort } = req.query;
        let query = connection_1.db.select().from(schema_1.products);
        const CategoryEnum = zod_1.z.enum(["food", "toys", "accessories", "grooming", "other"]);
        let conditions = [];
        const categoryParsed = CategoryEnum.safeParse(category);
        if (categoryParsed.success) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.products.category, categoryParsed.data));
        }
        // Apply search filter
        if (search) {
            conditions.push((0, drizzle_orm_1.like)(schema_1.products.name, `%${search}%`));
        }
        if (conditions.length > 0) {
            query.where((0, drizzle_orm_1.and)(...conditions));
        }
        if (sort === "newest") {
            query.orderBy((0, drizzle_orm_1.desc)(schema_1.products.createdAt));
        }
        else if (sort === 'price_desc') {
            query.orderBy((0, drizzle_orm_1.desc)(schema_1.products.price));
        }
        else if (sort === 'price_asc') {
            query.orderBy((0, drizzle_orm_1.asc)(schema_1.products.price));
        }
        else {
            query.orderBy((0, drizzle_orm_1.asc)(schema_1.products.name));
        }
        const productsList = await query;
        return res.status(200).json({
            success: true,
            data: productsList
        });
    }
    catch (error) {
        console.error('Get all products error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching products'
        });
    }
};
exports.getAllProducts = getAllProducts;
const getProductById = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const [product] = await connection_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, productId));
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: product
        });
    }
    catch (error) {
        console.error('Get product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching product'
        });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        let imageUrl = null;
        if (req.file) {
            // Create a relative URL for the image
            imageUrl = `/uploads/${req.file.filename}`;
        }
        const newProduct = {
            name,
            description,
            price: price,
            imageUrl,
            category: category || 'other',
            stock: stock ? parseInt(stock) : 0
        };
        const [createdProduct] = await connection_1.db.insert(schema_1.products).values(newProduct).returning();
        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: createdProduct
        });
    }
    catch (error) {
        console.error('Create product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while creating product'
        });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { name, description, price, category, stock } = req.body;
        // Check if product exists
        const [existingProduct] = await connection_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, productId));
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        // Handle image upload if provided
        let imageUrl = existingProduct.imageUrl;
        if (req.file) {
            // If there's an existing image, delete it
            if (existingProduct.imageUrl) {
                const oldImagePath = path_1.default.join(__dirname, '../..', existingProduct.imageUrl);
                if (fs_1.default.existsSync(oldImagePath)) {
                    fs_1.default.unlinkSync(oldImagePath);
                }
            }
            // Set new image URL
            imageUrl = `/uploads/${req.file.filename}`;
        }
        // Update product
        const [updatedProduct] = await connection_1.db
            .update(schema_1.products)
            .set({
            name,
            description,
            price: price,
            imageUrl,
            category,
            stock: parseInt(stock),
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, productId))
            .returning();
        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    }
    catch (error) {
        console.error('Update product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating product'
        });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        // Check if product exists
        const [existingProduct] = await connection_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, productId));
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        // Delete image if exists
        if (existingProduct.imageUrl) {
            const imagePath = path_1.default.join(__dirname, '../..', existingProduct.imageUrl);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        // Delete product
        await connection_1.db.delete(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, productId));
        return res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting product'
        });
    }
};
exports.deleteProduct = deleteProduct;
