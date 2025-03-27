// Import necessary functions from drizzle
const { relations } = require('drizzle-orm');
const { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  decimal,
  pgEnum 
} = require('drizzle-orm/pg-core');

// Enums
const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
const petStatusEnum = pgEnum('pet_status', ['available', 'adopted', 'pending']);
const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewing', 'resolved']);
const productCategoryEnum = pgEnum('product_category', ['food', 'toys', 'accessories', 'grooming', 'other']);

// Users table
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pets table
const pets = pgTable('pets', {
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
const products = pgTable('products', {
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
const adoptionApplications = pgTable('adoption_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  petId: integer('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table
const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reports table
const reports = pgTable('reports', {
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
const reportResponses = pgTable('report_responses', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  adminId: integer('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  response: text('response').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'receiver' }),
  adoptionApplications: many(adoptionApplications),
  reports: many(reports),
  reportResponses: many(reportResponses),
}));

const petsRelations = relations(pets, ({ many }) => ({
  adoptionApplications: many(adoptionApplications),
}));

const adoptionApplicationsRelations = relations(adoptionApplications, ({ one }) => ({
  user: one(users, {
    fields: [adoptionApplications.userId],
    references: [users.id],
  }),
  pet: one(pets, {
    fields: [adoptionApplications.petId],
    references: [pets.id],
  }),
}));

const messagesRelations = relations(messages, ({ one }) => ({
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

const reportsRelations = relations(reports, ({ one, many }) => ({
  reporter: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  responses: many(reportResponses),
}));

const reportResponsesRelations = relations(reportResponses, ({ one }) => ({
  report: one(reports, {
    fields: [reportResponses.reportId],
    references: [reports.id],
  }),
  admin: one(users, {
    fields: [reportResponses.adminId],
    references: [users.id],
  }),
}));

// Export everything
module.exports = {
  userRoleEnum,
  petStatusEnum,
  reportStatusEnum,
  productCategoryEnum,
  users,
  pets,
  products,
  adoptionApplications,
  messages,
  reports,
  reportResponses,
  usersRelations,
  petsRelations,
  adoptionApplicationsRelations,
  messagesRelations,
  reportsRelations,
  reportResponsesRelations
};