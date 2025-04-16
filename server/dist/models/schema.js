"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportResponsesRelations = exports.reportsRelations = exports.messagesRelations = exports.adoptionApplicationsRelations = exports.petsRelations = exports.usersRelations = exports.reportResponses = exports.reports = exports.messages = exports.adoptionApplications = exports.products = exports.pets = exports.users = exports.productCategoryEnum = exports.reportStatusEnum = exports.petStatusEnum = exports.userRoleEnum = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
// Enums
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['admin', 'user']);
exports.petStatusEnum = (0, pg_core_1.pgEnum)('pet_status', ['available', 'adopted', 'pending']);
exports.reportStatusEnum = (0, pg_core_1.pgEnum)('report_status', ['pending', 'reviewing', 'resolved']);
exports.productCategoryEnum = (0, pg_core_1.pgEnum)('product_category', ['food', 'toys', 'accessories', 'grooming', 'other']);
// Users table
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)('password', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    role: (0, exports.userRoleEnum)('role').default('user').notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    address: (0, pg_core_1.text)('address'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Pets table
exports.pets = (0, pg_core_1.pgTable)('pets', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    species: (0, pg_core_1.varchar)('species', { length: 100 }).notNull(),
    breed: (0, pg_core_1.varchar)('breed', { length: 100 }),
    age: (0, pg_core_1.integer)('age'),
    gender: (0, pg_core_1.varchar)('gender', { length: 20 }),
    description: (0, pg_core_1.text)('description'),
    imageUrl: (0, pg_core_1.text)('image_url'),
    status: (0, exports.petStatusEnum)('status').default('available').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Products table
exports.products = (0, pg_core_1.pgTable)('products', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    price: (0, pg_core_1.decimal)('price', { precision: 10, scale: 2 }).notNull(),
    imageUrl: (0, pg_core_1.text)('image_url'),
    category: (0, exports.productCategoryEnum)('category').default('other').notNull(),
    stock: (0, pg_core_1.integer)('stock').default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Adoption Applications table
exports.adoptionApplications = (0, pg_core_1.pgTable)('adoption_applications', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    petId: (0, pg_core_1.integer)('pet_id').notNull().references(() => exports.pets.id, { onDelete: 'cascade' }),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('pending').notNull(),
    message: (0, pg_core_1.text)('message'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Messages table
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    senderId: (0, pg_core_1.integer)('sender_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    receiverId: (0, pg_core_1.integer)('receiver_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    subject: (0, pg_core_1.varchar)('subject', { length: 255 }),
    content: (0, pg_core_1.text)('content').notNull(),
    isRead: (0, pg_core_1.boolean)('is_read').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Reports table
exports.reports = (0, pg_core_1.pgTable)('reports', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    location: (0, pg_core_1.varchar)('location', { length: 255 }),
    imageUrl: (0, pg_core_1.text)('image_url'),
    status: (0, exports.reportStatusEnum)('status').default('pending').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Report Responses table
exports.reportResponses = (0, pg_core_1.pgTable)('report_responses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    reportId: (0, pg_core_1.integer)('report_id').notNull().references(() => exports.reports.id, { onDelete: 'cascade' }),
    adminId: (0, pg_core_1.integer)('admin_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    response: (0, pg_core_1.text)('response').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    adoptionApplications: many(exports.adoptionApplications),
    sentMessages: many(exports.messages, { relationName: 'senderRelation' }),
    receivedMessages: many(exports.messages, { relationName: 'receiverRelation' }),
    reports: many(exports.reports),
    reportResponses: many(exports.reportResponses),
}));
exports.petsRelations = (0, drizzle_orm_1.relations)(exports.pets, ({ many }) => ({
    adoptionApplications: many(exports.adoptionApplications),
}));
exports.adoptionApplicationsRelations = (0, drizzle_orm_1.relations)(exports.adoptionApplications, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.adoptionApplications.userId],
        references: [exports.users.id],
    }),
    pet: one(exports.pets, {
        fields: [exports.adoptionApplications.petId],
        references: [exports.pets.id],
    }),
}));
exports.messagesRelations = (0, drizzle_orm_1.relations)(exports.messages, ({ one }) => ({
    sender: one(exports.users, {
        fields: [exports.messages.senderId],
        references: [exports.users.id],
        relationName: 'senderRelation'
    }),
    receiver: one(exports.users, {
        fields: [exports.messages.receiverId],
        references: [exports.users.id],
        relationName: 'receiverRelation'
    }),
}));
exports.reportsRelations = (0, drizzle_orm_1.relations)(exports.reports, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.reports.userId],
        references: [exports.users.id],
    }),
    responses: many(exports.reportResponses),
}));
exports.reportResponsesRelations = (0, drizzle_orm_1.relations)(exports.reportResponses, ({ one }) => ({
    report: one(exports.reports, {
        fields: [exports.reportResponses.reportId],
        references: [exports.reports.id],
    }),
    admin: one(exports.users, {
        fields: [exports.reportResponses.adminId],
        references: [exports.users.id],
    }),
}));
