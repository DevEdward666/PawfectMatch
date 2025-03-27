/**
 * Database schema definitions using Drizzle ORM
 */
const { pgTable, serial, varchar, text, integer, boolean, timestamp, pgEnum } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Role enum for users
const roleEnum = pgEnum('role', ['admin', 'customer']);

// Status enums
const adoptionStatusEnum = pgEnum('adoption_status', ['available', 'pending', 'adopted']);
const reportStatusEnum = pgEnum('report_status', ['pending', 'investigating', 'resolved', 'dismissed']);
const messageStatusEnum = pgEnum('message_status', ['unread', 'read', 'replied']);

// Users table
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 100 }).notNull(),
  role: roleEnum('role').notNull().default('customer'),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Pets table
const pets = pgTable('pets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  species: varchar('species', { length: 50 }).notNull(),
  breed: varchar('breed', { length: 50 }),
  age: integer('age'),
  gender: varchar('gender', { length: 10 }),
  size: varchar('size', { length: 10 }),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 255 }),
  status: adoptionStatusEnum('status').notNull().default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Product categories table
const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Products table
const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // Store in cents
  imageUrl: varchar('image_url', { length: 255 }),
  stock: integer('stock').notNull().default(0),
  categoryId: integer('category_id').references(() => productCategories.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Adoption applications table
const adoptionApplications = pgTable('adoption_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  petId: integer('pet_id').notNull().references(() => pets.id),
  status: adoptionStatusEnum('status').notNull().default('pending'),
  applicationText: text('application_text'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Messages table
const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  subject: varchar('subject', { length: 100 }).notNull(),
  content: text('content').notNull(),
  status: messageStatusEnum('status').notNull().default('unread'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Reports table
const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  location: varchar('location', { length: 255 }),
  imageUrl: varchar('image_url', { length: 255 }),
  status: reportStatusEnum('status').notNull().default('pending'),
  adminResponse: text('admin_response'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define relations
const usersRelations = relations(users, ({ many }) => ({
  adoptionApplications: many(adoptionApplications),
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'receiver' }),
  reports: many(reports)
}));

const petsRelations = relations(pets, ({ many }) => ({
  adoptionApplications: many(adoptionApplications)
}));

const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products)
}));

const productsRelations = relations(products, ({ one }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id]
  })
}));

const adoptionApplicationsRelations = relations(adoptionApplications, ({ one }) => ({
  user: one(users, {
    fields: [adoptionApplications.userId],
    references: [users.id]
  }),
  pet: one(pets, {
    fields: [adoptionApplications.petId],
    references: [pets.id]
  })
}));

const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sender'
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: 'receiver'
  })
}));

const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id]
  })
}));

module.exports = {
  users,
  pets,
  productCategories,
  products,
  adoptionApplications,
  messages,
  reports,
  roleEnum,
  adoptionStatusEnum,
  reportStatusEnum,
  messageStatusEnum
};
