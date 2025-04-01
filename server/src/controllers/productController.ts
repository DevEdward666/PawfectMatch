import { Request, Response } from 'express';
import { db } from '../config/database';
import { products, Product, InsertProduct } from '../models/schema';
import { and,eq, asc, desc, like } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { z } from "zod";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { category, search, sort } = req.query;
    
    let query = db.select().from(products);
    const CategoryEnum = z.enum(["food", "toys", "accessories","grooming","other"]);

    let conditions = [];
    const categoryParsed = CategoryEnum.safeParse(category);
    if (categoryParsed.success) {
      conditions.push(eq(products.category, categoryParsed.data));
    }
    // Apply search filter
    if (search) {
      conditions.push(like(products.name,`%${search}%`));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions)); 
    }
    if (sort === "newest") {
      query.orderBy(desc(products.createdAt));
    }else if(sort === 'price_desc'){
      query.orderBy(desc(products.price));
    } else if(sort === 'price_asc'){
      query.orderBy(asc(products.price));
    } else {
      query.orderBy(asc(products.name));
    }
    const productsList = await query;
    
    return res.status(200).json({
      success: true,
      data: productsList
    });
  } catch (error) {
    console.error('Get all products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    
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
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      // Create a relative URL for the image
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const newProduct: InsertProduct = {
      name,
      description,
      price: price,
      imageUrl,
      category: category || 'other',
      stock: stock ? parseInt(stock) : 0
    };
    
    const [createdProduct] = await db.insert(products).values(newProduct).returning();
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: createdProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, category, stock } = req.body;
    
    // Check if product exists
    const [existingProduct] = await db.select().from(products).where(eq(products.id, productId));
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
        const oldImagePath = path.join(__dirname, '../..', existingProduct.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Set new image URL
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        name,
        description,
        price: price,
        imageUrl,
        category,
        stock: parseInt(stock),
        updatedAt: new Date()
      })
      .where(eq(products.id, productId))
      .returning();
    
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    
    // Check if product exists
    const [existingProduct] = await db.select().from(products).where(eq(products.id, productId));
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Delete image if exists
    if (existingProduct.imageUrl) {
      const imagePath = path.join(__dirname, '../..', existingProduct.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete product
    await db.delete(products).where(eq(products.id, productId));
    
    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};
