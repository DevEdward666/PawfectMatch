import { relations } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  decimal,
  pgEnum 
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const petStatusEnum = pgEnum('pet_status', ['available', 'adopted', 'pending']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewing', 'resolved']);
export const productCategoryEnum = pgEnum('product_category', ['food', 'toys', 'accessories', 'grooming', 'other']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull(),
  password: varchar('password').notNull(),
  name: varchar('name').notNull(),
  role: varchar('role').notNull(),
  phone: varchar('phone'),
  address: varchar('address'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Pets table
export const pets = pgTable('pets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  species: varchar('species', { length: 100 }).notNull(),
  breed: varchar('breed', { length: 100 }),
  age: integer('age'),
  gender: varchar('gender', { length: 20 }),
  description: text('description'),
  imageUrl: text('image_url'),
  status: petStatusEnum('status').default('available').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  category: productCategoryEnum('category').default('other').notNull(),
  stock: integer('stock').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Adoption Applications table
export const adoptionApplications = pgTable('adoption_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  petId: integer('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reports table
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  location: text('location'),
  imageUrl: text('image_url'),
  status: reportStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Report Responses table
export const reportResponses = pgTable('report_responses', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  adminId: integer('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  response: text('response').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'receiver' }),
  adoptionApplications: many(adoptionApplications),
  reports: many(reports),
  reportResponses: many(reportResponses),
}));

export const petsRelations = relations(pets, ({ many }) => ({
  adoptionApplications: many(adoptionApplications),
}));

export const adoptionApplicationsRelations = relations(adoptionApplications, ({ one }) => ({
  user: one(users, {
    fields: [adoptionApplications.userId],
    references: [users.id],
  }),
  pet: one(pets, {
    fields: [adoptionApplications.petId],
    references: [pets.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  reporter: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  responses: many(reportResponses),
}));

export const reportResponsesRelations = relations(reportResponses, ({ one }) => ({
  report: one(reports, {
    fields: [reportResponses.reportId],
    references: [reports.id],
  }),
  admin: one(users, {
    fields: [reportResponses.adminId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type AdoptionApplication = typeof adoptionApplications.$inferSelect;
export type InsertAdoptionApplication = typeof adoptionApplications.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

export type ReportResponse = typeof reportResponses.$inferSelect;
export type InsertReportResponse = typeof reportResponses.$inferInsert;