import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createStaff, getStaffList, updateStaff, getStaff, deleteStaff } from './staff.js';
import { query } from '../config/database.js';
import { AuthRequest } from '../types/index.js';
import { Response } from 'express';
import { cache } from '../utils/cache.js';

/**
 * Property-Based Tests for Staff Controller
 * Feature: staff-employee-management
 * 
 * These tests validate that the staff controller correctly handles staff creation
 * across a wide range of inputs using property-based testing.
 */

// Helper to create a mock AuthRequest
const createMockAuthRequest = (body: any, schoolId: string): Partial<AuthRequest> => ({
  body,
  user: {
    userId: schoolId,
    role: 'school',
    email: 'test@school.com',
  },
});

// Helper to create a mock AuthRequest with query parameters
const createMockAuthRequestWithQuery = (query: any, schoolId: string): Partial<AuthRequest> => ({
  query,
  user: {
    userId: schoolId,
    role: 'school',
    email: 'test@school.com',
  },
});

// Helper to create a mock AuthRequest with params
const createMockAuthRequestWithParams = (body: any, params: any, schoolId: string): Partial<AuthRequest> => ({
  body,
  params,
  user: {
    userId: schoolId,
    role: 'school',
    email: 'test@school.com',
  },
});

// Helper to create a mock Response
const createMockResponse = (): Partial<Response> => {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

// Test school ID (will be created in beforeEach)
let testSchoolId: string;

describe('Staff Controller - Property-Based Tests', () => {
  beforeEach(async () => {
    // Create a test school for each test
    const result = await query(
      `INSERT INTO schools (name, email, password_hash, state, city, pincode, status, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        'Test School',
        `test-${Date.now()}@school.com`,
        'hashed_password',
        'West Bengal',
        'Kolkata',
        '700001',
        'approved',
        true
      ]
    );
    testSchoolId = result.rows[0].id;
  });

  afterEach(async () => {
    // Clean up: delete test school and all related staff
    await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
    await query('DELETE FROM schools WHERE id = $1', [testSchoolId]);
  });

  /**
   * Property 1: Staff creation succeeds with valid data
   * Validates: Requirements 1.1
   * 
   * For any valid staff data (with all required fields: name, staff_type, designation,
   * state, district, city, pincode), creating a staff member should succeed and return
   * a staff record with all provided fields intact and a generated UUID.
   */
  describe('Property 1: Staff creation succeeds with valid data', () => {
    it('should create staff with all valid required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            staff_type: fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
            designation: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            state: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            district: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            city: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            pincode: fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
            photo_url: fc.webUrl(),
          }),
          async (validStaffData) => {
            const req = createMockAuthRequest(validStaffData, testSchoolId) as AuthRequest;
            const res = createMockResponse() as Response;

            await createStaff(req, res);

            // Should return 201 status
            expect(res.statusCode).toBe(201);
            
            // Should return success response
            expect(res.jsonData).toBeDefined();
            expect(res.jsonData.success).toBe(true);
            expect(res.jsonData.data).toBeDefined();
            
            // Should have generated UUID
            expect(res.jsonData.data.id).toBeDefined();
            expect(typeof res.jsonData.data.id).toBe('string');
            
            // Should have correct school_id
            expect(res.jsonData.data.school_id).toBe(testSchoolId);
            
            // All provided fields should be intact
            expect(res.jsonData.data.name).toBe(validStaffData.name);
            expect(res.jsonData.data.staff_type).toBe(validStaffData.staff_type);
            expect(res.jsonData.data.designation).toBe(validStaffData.designation);
            expect(res.jsonData.data.state).toBe(validStaffData.state);
            expect(res.jsonData.data.district).toBe(validStaffData.district);
            expect(res.jsonData.data.city).toBe(validStaffData.city);
            expect(res.jsonData.data.pincode).toBe(validStaffData.pincode);
            
            // Should have timestamps
            expect(res.jsonData.data.created_at).toBeDefined();
            expect(res.jsonData.data.updated_at).toBeDefined();
            
            // Feature: staff-employee-management, Property 1: Staff creation succeeds with valid data
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should create staff with all valid fields including optional ones', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Required fields
            name: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            staff_type: fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
            designation: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            state: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            district: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            city: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            pincode: fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
            photo_url: fc.webUrl(),
            // Optional fields
            father_spouse_name: fc.string({ minLength: 1, maxLength: 255 }),
            date_of_birth: fc.date({ min: new Date('1950-01-01'), max: new Date('2005-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            gender: fc.constantFrom('Male', 'Female', 'Other'),
            phone_number: fc.integer({ min: 6000000000, max: 9999999999 })
              .map(n => `+91${n}`),
            blood_group: fc.constantFrom('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
            employee_id: fc.string({ minLength: 1, maxLength: 50 }),
            department: fc.string({ minLength: 1, maxLength: 100 }),
            date_of_joining: fc.date({ min: new Date('2000-01-01'), max: new Date() })
              .map(d => d.toISOString().split('T')[0]),
            qualification: fc.string({ minLength: 1, maxLength: 255 }),
            address: fc.string({ minLength: 1, maxLength: 500 }),
            emergency_contact_name: fc.string({ minLength: 1, maxLength: 255 }),
            emergency_contact_number: fc.integer({ min: 6000000000, max: 9999999999 })
              .map(n => `+91${n}`),
            emergency_contact_relationship: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async (validStaffData) => {
            const req = createMockAuthRequest(validStaffData, testSchoolId) as AuthRequest;
            const res = createMockResponse() as Response;

            await createStaff(req, res);

            // Should return 201 status
            expect(res.statusCode).toBe(201);
            
            // Should return success response
            expect(res.jsonData).toBeDefined();
            expect(res.jsonData.success).toBe(true);
            expect(res.jsonData.data).toBeDefined();
            
            // Should have generated UUID
            expect(res.jsonData.data.id).toBeDefined();
            
            // All provided fields should be intact
            expect(res.jsonData.data.name).toBe(validStaffData.name);
            expect(res.jsonData.data.staff_type).toBe(validStaffData.staff_type);
            expect(res.jsonData.data.designation).toBe(validStaffData.designation);
            expect(res.jsonData.data.father_spouse_name).toBe(validStaffData.father_spouse_name);
            expect(res.jsonData.data.gender).toBe(validStaffData.gender);
            expect(res.jsonData.data.phone_number).toBe(validStaffData.phone_number);
            expect(res.jsonData.data.blood_group).toBe(validStaffData.blood_group);
            expect(res.jsonData.data.photo_url).toBe(validStaffData.photo_url);
            expect(res.jsonData.data.employee_id).toBe(validStaffData.employee_id);
            expect(res.jsonData.data.department).toBe(validStaffData.department);
            expect(res.jsonData.data.qualification).toBe(validStaffData.qualification);
            expect(res.jsonData.data.address).toBe(validStaffData.address);
            expect(res.jsonData.data.emergency_contact_name).toBe(validStaffData.emergency_contact_name);
            expect(res.jsonData.data.emergency_contact_number).toBe(validStaffData.emergency_contact_number);
            expect(res.jsonData.data.emergency_contact_relationship).toBe(validStaffData.emergency_contact_relationship);
            
            // Feature: staff-employee-management, Property 1: Staff creation succeeds with valid data
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 2: Photo URL is mandatory
   * Validates: Requirements 1.3, 4.5
   * 
   * For any staff data without a photo_url field, attempting to create the staff member
   * should be rejected with a validation error.
   */
  describe('Property 2: Photo URL is mandatory', () => {
    it('should reject staff creation without photo_url', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 255 }),
            staff_type: fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
            designation: fc.string({ minLength: 1, maxLength: 100 }),
            state: fc.string({ minLength: 1, maxLength: 100 }),
            district: fc.string({ minLength: 1, maxLength: 100 }),
            city: fc.string({ minLength: 1, maxLength: 100 }),
            pincode: fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
            // Intentionally omit photo_url
          }),
          async (staffDataWithoutPhoto) => {
            const req = createMockAuthRequest(staffDataWithoutPhoto, testSchoolId) as AuthRequest;
            const res = createMockResponse() as Response;

            await createStaff(req, res);

            // Should return 400 status (validation error)
            expect(res.statusCode).toBe(400);
            
            // Should return error response
            expect(res.jsonData).toBeDefined();
            expect(res.jsonData.success).toBe(false);
            expect(res.jsonData.error).toBeDefined();
            expect(res.jsonData.error.code).toBe('VALIDATION_ERROR');
            
            // Error should mention photo_url
            const errorDetails = JSON.stringify(res.jsonData.error);
            expect(errorDetails.toLowerCase()).toContain('photo');
            
            // Feature: staff-employee-management, Property 2: Photo URL is mandatory
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject staff creation with empty photo_url', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 255 }),
            staff_type: fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
            designation: fc.string({ minLength: 1, maxLength: 100 }),
            state: fc.string({ minLength: 1, maxLength: 100 }),
            district: fc.string({ minLength: 1, maxLength: 100 }),
            city: fc.string({ minLength: 1, maxLength: 100 }),
            pincode: fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
            photo_url: fc.constant(''), // Empty string
          }),
          async (staffDataWithEmptyPhoto) => {
            const req = createMockAuthRequest(staffDataWithEmptyPhoto, testSchoolId) as AuthRequest;
            const res = createMockResponse() as Response;

            await createStaff(req, res);

            // Should return 400 status (validation error)
            expect(res.statusCode).toBe(400);
            
            // Should return error response
            expect(res.jsonData).toBeDefined();
            expect(res.jsonData.success).toBe(false);
            expect(res.jsonData.error).toBeDefined();
            expect(res.jsonData.error.code).toBe('VALIDATION_ERROR');
            
            // Error should mention photo_url
            const errorDetails = JSON.stringify(res.jsonData.error);
            expect(errorDetails.toLowerCase()).toContain('photo');
            
            // Feature: staff-employee-management, Property 2: Photo URL is mandatory
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accept staff creation with valid photo_url', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 255 }),
            staff_type: fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
            designation: fc.string({ minLength: 1, maxLength: 100 }),
            state: fc.string({ minLength: 1, maxLength: 100 }),
            district: fc.string({ minLength: 1, maxLength: 100 }),
            city: fc.string({ minLength: 1, maxLength: 100 }),
            pincode: fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
            photo_url: fc.webUrl(), // Valid URL
          }),
          async (staffDataWithPhoto) => {
            const req = createMockAuthRequest(staffDataWithPhoto, testSchoolId) as AuthRequest;
            const res = createMockResponse() as Response;

            await createStaff(req, res);

            // Should return 201 status (success)
            expect(res.statusCode).toBe(201);
            
            // Should return success response
            expect(res.jsonData).toBeDefined();
            expect(res.jsonData.success).toBe(true);
            expect(res.jsonData.data).toBeDefined();
            
            // Should have the photo_url
            expect(res.jsonData.data.photo_url).toBe(staffDataWithPhoto.photo_url);
            
            // Feature: staff-employee-management, Property 2: Photo URL is mandatory
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 4: Staff list returns all school staff
   * Validates: Requirements 3.1
   * 
   * For any school with N staff members, querying the staff list without filters
   * should return all N staff members belonging to that school and no staff from other schools.
   */
  describe('Property 4: Staff list returns all school staff', () => {
    it('should return all staff members for a school and none from other schools', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a random number of staff members (1-20)
          fc.integer({ min: 1, max: 20 }),
          async (staffCount) => {
            // CRITICAL: Clean up ALL staff for test school before this iteration
            // This ensures we start with a clean slate for each property test iteration
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            
            // Also clean up any orphaned staff from failed test runs
            await query('DELETE FROM staff WHERE school_id NOT IN (SELECT id FROM schools)');

            // Verify cleanup worked
            const preCheckResult = await query('SELECT COUNT(*) FROM staff WHERE school_id = $1', [testSchoolId]);
            const preCount = parseInt(preCheckResult.rows[0].count, 10);
            if (preCount !== 0) {
              throw new Error(`Cleanup failed: Expected 0 staff, found ${preCount}`);
            }

            // Create another school to test data isolation
            const otherSchoolResult = await query(
              `INSERT INTO schools (name, email, password_hash, state, city, pincode, status, email_verified)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING id`,
              [
                'Other School',
                `other-${Date.now()}-${Math.random()}@school.com`,
                'hashed_password',
                'West Bengal',
                'Kolkata',
                '700002',
                'approved',
                true
              ]
            );
            const otherSchoolId = otherSchoolResult.rows[0].id;

            try {
              // Create N staff members for the test school
              const testSchoolStaffIds: string[] = [];
              for (let i = 0; i < staffCount; i++) {
                const staffData = {
                  name: `Test Staff ${i}`,
                  staff_type: ['Teaching', 'Non-Teaching', 'Administrative', 'Support'][i % 4],
                  designation: `Designation ${i}`,
                  state: 'West Bengal',
                  district: 'Kolkata',
                  city: 'Kolkata',
                  pincode: '700001',
                  photo_url: `https://example.com/photo-${i}.jpg`,
                };

                const result = await query(
                  `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                   RETURNING id`,
                  [
                    testSchoolId,
                    staffData.name,
                    staffData.staff_type,
                    staffData.designation,
                    staffData.state,
                    staffData.district,
                    staffData.city,
                    staffData.pincode,
                    staffData.photo_url,
                  ]
                );
                testSchoolStaffIds.push(result.rows[0].id);
              }

              // Verify we created exactly N staff
              const postCreateResult = await query('SELECT COUNT(*) FROM staff WHERE school_id = $1', [testSchoolId]);
              const postCreateCount = parseInt(postCreateResult.rows[0].count, 10);
              if (postCreateCount !== staffCount) {
                throw new Error(`Creation mismatch: Expected ${staffCount} staff, found ${postCreateCount}`);
              }

              // Create some staff members for the other school (to test isolation)
              const otherSchoolStaffCount = Math.floor(Math.random() * 5) + 1;
              for (let i = 0; i < otherSchoolStaffCount; i++) {
                await query(
                  `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                  [
                    otherSchoolId,
                    `Other School Staff ${i}`,
                    'Teaching',
                    'Teacher',
                    'West Bengal',
                    'Kolkata',
                    'Kolkata',
                    '700002',
                    `https://example.com/other-photo-${i}.jpg`,
                  ]
                );
              }

              // Query staff list for test school (without filters)
              const req = createMockAuthRequestWithQuery({}, testSchoolId) as AuthRequest;
              const res = createMockResponse() as Response;

              await getStaffList(req, res);

              // Should return 200 status
              expect(res.statusCode).toBe(200);

              // Should return success response
              expect(res.jsonData).toBeDefined();
              expect(res.jsonData.success).toBe(true);
              expect(res.jsonData.data).toBeDefined();
              expect(Array.isArray(res.jsonData.data)).toBe(true);

              // Should return exactly N staff members
              expect(res.jsonData.data.length).toBe(staffCount);

              // Total count should match
              expect(res.jsonData.total).toBe(staffCount);

              // All returned staff should belong to test school
              for (const staff of res.jsonData.data) {
                expect(staff.school_id).toBe(testSchoolId);
              }

              // All created staff IDs should be in the response
              const returnedStaffIds = res.jsonData.data.map((s: any) => s.id);
              for (const staffId of testSchoolStaffIds) {
                expect(returnedStaffIds).toContain(staffId);
              }

              // No staff from other school should be in the response
              const otherSchoolStaffResult = await query(
                'SELECT id FROM staff WHERE school_id = $1',
                [otherSchoolId]
              );
              const otherSchoolStaffIds = otherSchoolStaffResult.rows.map(row => row.id);
              for (const otherStaffId of otherSchoolStaffIds) {
                expect(returnedStaffIds).not.toContain(otherStaffId);
              }

              // Feature: staff-employee-management, Property 4: Staff list returns all school staff
            } finally {
              // Clean up other school and its staff
              await query('DELETE FROM staff WHERE school_id = $1', [otherSchoolId]);
              await query('DELETE FROM schools WHERE id = $1', [otherSchoolId]);
              // Clean up test school staff created in this iteration
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return empty array when school has no staff', async () => {
      // Clean up any existing staff for test school
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Query staff list for school with no staff
      const req = createMockAuthRequestWithQuery({}, testSchoolId) as AuthRequest;
      const res = createMockResponse() as Response;

      await getStaffList(req, res);

      // Should return 200 status
      expect(res.statusCode).toBe(200);

      // Should return success response with empty array
      expect(res.jsonData).toBeDefined();
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data).toBeDefined();
      expect(Array.isArray(res.jsonData.data)).toBe(true);
      expect(res.jsonData.data.length).toBe(0);
      expect(res.jsonData.total).toBe(0);

      // Feature: staff-employee-management, Property 4: Staff list returns all school staff
    });

    it('should handle pagination correctly with large staff count', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a staff count larger than default page size (50)
          fc.integer({ min: 51, max: 100 }),
          async (staffCount) => {
            // CRITICAL: Clean up ALL staff for test school before this iteration
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create staff members
            for (let i = 0; i < staffCount; i++) {
              await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  testSchoolId,
                  `Staff ${i}`,
                  'Teaching',
                  'Teacher',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo-${i}.jpg`,
                ]
              );
            }

            try {
              // Query first page (default limit is 50)
              const req = createMockAuthRequestWithQuery({ page: '1' }, testSchoolId) as AuthRequest;
              const res = createMockResponse() as Response;

              await getStaffList(req, res);

              // Should return 200 status
              expect(res.statusCode).toBe(200);

              // Should return success response
              expect(res.jsonData).toBeDefined();
              expect(res.jsonData.success).toBe(true);
              expect(res.jsonData.data).toBeDefined();

              // Should return at most 50 items (default page size)
              expect(res.jsonData.data.length).toBeLessThanOrEqual(50);

              // Total count should match the created staff count
              expect(res.jsonData.total).toBe(staffCount);

              // Should have correct page info
              expect(res.jsonData.page).toBe(1);
              expect(res.jsonData.pages).toBe(Math.ceil(staffCount / 50));

              // All returned staff should belong to test school
              for (const staff of res.jsonData.data) {
                expect(staff.school_id).toBe(testSchoolId);
              }

              // Feature: staff-employee-management, Property 4: Staff list returns all school staff
            } finally {
              // Clean up test school staff created in this iteration
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 } // Reduced runs due to larger data set
      );
    });
  });
});

  /**
   * Property 5: Search and filters return matching results only
   * Validates: Requirements 3.2, 3.3
   * 
   * For any search query (by name, employee_id, or department) or filter (by staff_type, department),
   * all returned staff members should match the search/filter criteria, and no matching staff should be excluded.
   */
  describe('Property 5: Search and filters return matching results only', () => {
    it('should return only staff matching search query by name', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 10 }).filter(s => s.trim().length >= 3),
          async (searchTerm) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create staff with names that contain the search term
            const matchingStaffCount = Math.floor(Math.random() * 5) + 2;
            const matchingStaffIds: string[] = [];
            
            for (let i = 0; i < matchingStaffCount; i++) {
              const result = await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                  testSchoolId,
                  `Staff ${searchTerm} ${i}`,
                  'Teaching',
                  'Teacher',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo-${i}.jpg`,
                ]
              );
              matchingStaffIds.push(result.rows[0].id);
            }

            // Create staff with names that don't contain the search term
            const nonMatchingCount = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < nonMatchingCount; i++) {
              await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  testSchoolId,
                  `Different Name ${i}`,
                  'Teaching',
                  'Teacher',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo-${i}.jpg`,
                ]
              );
            }

            try {
              // Query with search term
              const req = createMockAuthRequestWithQuery({ search: searchTerm }, testSchoolId) as AuthRequest;
              const res = createMockResponse() as Response;

              await getStaffList(req, res);

              // Should return 200 status
              expect(res.statusCode).toBe(200);
              expect(res.jsonData.success).toBe(true);

              // All returned staff should have the search term in their name
              for (const staff of res.jsonData.data) {
                expect(staff.name.toLowerCase()).toContain(searchTerm.toLowerCase());
              }

              // Should return all matching staff
              expect(res.jsonData.data.length).toBe(matchingStaffCount);

              // Feature: staff-employee-management, Property 5: Search and filters return matching results only
            } finally {
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return only staff matching staff_type filter', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
          async (staffType) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create staff of the target type
            const matchingCount = Math.floor(Math.random() * 5) + 2;
            for (let i = 0; i < matchingCount; i++) {
              await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  testSchoolId,
                  `Staff ${i}`,
                  staffType,
                  'Designation',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo-${i}.jpg`,
                ]
              );
            }

            // Create staff of other types
            const otherTypes = ['Teaching', 'Non-Teaching', 'Administrative', 'Support'].filter(t => t !== staffType);
            for (const otherType of otherTypes) {
              await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  testSchoolId,
                  `Other Staff ${otherType}`,
                  otherType,
                  'Designation',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo.jpg`,
                ]
              );
            }

            try {
              // Query with staff_type filter
              const req = createMockAuthRequestWithQuery({ staff_type: staffType }, testSchoolId) as AuthRequest;
              const res = createMockResponse() as Response;

              await getStaffList(req, res);

              // Should return 200 status
              expect(res.statusCode).toBe(200);
              expect(res.jsonData.success).toBe(true);

              // All returned staff should have the correct staff_type
              for (const staff of res.jsonData.data) {
                expect(staff.staff_type).toBe(staffType);
              }

              // Should return all matching staff
              expect(res.jsonData.data.length).toBe(matchingCount);

              // Feature: staff-employee-management, Property 5: Search and filters return matching results only
            } finally {
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return only staff matching department filter', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          async (department) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create staff in the target department
            const matchingCount = Math.floor(Math.random() * 5) + 2;
            for (let i = 0; i < matchingCount; i++) {
              await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, department, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  testSchoolId,
                  `Staff ${i}`,
                  'Teaching',
                  'Teacher',
                  department,
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo-${i}.jpg`,
                ]
              );
            }

            // Create staff in other departments
            const otherDepartmentCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < otherDepartmentCount; i++) {
              await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, department, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  testSchoolId,
                  `Other Staff ${i}`,
                  'Teaching',
                  'Teacher',
                  `Other Department ${i}`,
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo.jpg`,
                ]
              );
            }

            try {
              // Query with department filter
              const req = createMockAuthRequestWithQuery({ department }, testSchoolId) as AuthRequest;
              const res = createMockResponse() as Response;

              await getStaffList(req, res);

              // Should return 200 status
              expect(res.statusCode).toBe(200);
              expect(res.jsonData.success).toBe(true);

              // All returned staff should have the correct department
              for (const staff of res.jsonData.data) {
                expect(staff.department).toBe(department);
              }

              // Should return all matching staff
              expect(res.jsonData.data.length).toBe(matchingCount);

              // Feature: staff-employee-management, Property 5: Search and filters return matching results only
            } finally {
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 6: Pagination returns correct subsets
   * Validates: Requirements 3.4
   * 
   * For any staff list with total count T and page size L, requesting page P should return
   * at most L items, with correct offset (P-1)*L, and the total count should equal T across all pages.
   */
  describe('Property 6: Pagination returns correct subsets', () => {
    it('should return correct page subsets with proper offset', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            totalStaff: fc.integer({ min: 10, max: 30 }),
            pageSize: fc.integer({ min: 5, max: 10 }),
            pageNumber: fc.integer({ min: 1, max: 5 }),
          }),
          async ({ totalStaff, pageSize, pageNumber }) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create staff members with sequential names for easy verification
            const staffIds: string[] = [];
            for (let i = 0; i < totalStaff; i++) {
              const result = await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                  testSchoolId,
                  `Staff ${String(i).padStart(3, '0')}`, // Padded for consistent sorting
                  'Teaching',
                  'Teacher',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo-${i}.jpg`,
                ]
              );
              staffIds.push(result.rows[0].id);
            }

            try {
              // Calculate expected values
              const totalPages = Math.ceil(totalStaff / pageSize);
              
              // Only test if the requested page is valid
              if (pageNumber <= totalPages) {
                const expectedOffset = (pageNumber - 1) * pageSize;
                const expectedCount = Math.min(pageSize, totalStaff - expectedOffset);

                // Query the specific page
                const req = createMockAuthRequestWithQuery(
                  { page: pageNumber.toString(), limit: pageSize.toString() },
                  testSchoolId
                ) as AuthRequest;
                const res = createMockResponse() as Response;

                await getStaffList(req, res);

                // Should return 200 status
                expect(res.statusCode).toBe(200);
                expect(res.jsonData.success).toBe(true);

                // Should return correct number of items
                expect(res.jsonData.data.length).toBe(expectedCount);

                // Total count should match
                expect(res.jsonData.total).toBe(totalStaff);

                // Page info should be correct
                expect(res.jsonData.page).toBe(pageNumber);
                expect(res.jsonData.pages).toBe(totalPages);

                // All returned staff should belong to test school
                for (const staff of res.jsonData.data) {
                  expect(staff.school_id).toBe(testSchoolId);
                }
              }

              // Feature: staff-employee-management, Property 6: Pagination returns correct subsets
            } finally {
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return empty array for page beyond total pages', async () => {
      // Clean up
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Create 5 staff members
      for (let i = 0; i < 5; i++) {
        await query(
          `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            testSchoolId,
            `Staff ${i}`,
            'Teaching',
            'Teacher',
            'West Bengal',
            'Kolkata',
            'Kolkata',
            '700001',
            `https://example.com/photo-${i}.jpg`,
          ]
        );
      }

      try {
        // Request page 10 (way beyond available pages)
        const req = createMockAuthRequestWithQuery(
          { page: '10', limit: '10' },
          testSchoolId
        ) as AuthRequest;
        const res = createMockResponse() as Response;

        await getStaffList(req, res);

        // Should return 200 status
        expect(res.statusCode).toBe(200);
        expect(res.jsonData.success).toBe(true);

        // Should return empty array
        expect(res.jsonData.data.length).toBe(0);

        // Total count should still be correct
        expect(res.jsonData.total).toBe(5);

        // Feature: staff-employee-management, Property 6: Pagination returns correct subsets
      } finally {
        await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
      }
    });

    it('should handle page size of 1 correctly', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 3, max: 10 }),
          async (totalStaff) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create staff members
            for (let i = 0; i < totalStaff; i++) {
              await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  testSchoolId,
                  `Staff ${i}`,
                  'Teaching',
                  'Teacher',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  `https://example.com/photo-${i}.jpg`,
                ]
              );
            }

            try {
              // Request first page with page size 1
              const req = createMockAuthRequestWithQuery(
                { page: '1', limit: '1' },
                testSchoolId
              ) as AuthRequest;
              const res = createMockResponse() as Response;

              await getStaffList(req, res);

              // Should return 200 status
              expect(res.statusCode).toBe(200);
              expect(res.jsonData.success).toBe(true);

              // Should return exactly 1 item
              expect(res.jsonData.data.length).toBe(1);

              // Total count should match
              expect(res.jsonData.total).toBe(totalStaff);

              // Should have correct number of pages
              expect(res.jsonData.pages).toBe(totalStaff);

              // Feature: staff-employee-management, Property 6: Pagination returns correct subsets
            } finally {
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 7: Staff updates persist correctly
   * Validates: Requirements 6.1
   * 
   * For any existing staff member and any valid update data, updating the staff member
   * should succeed, and immediately querying the same staff member should return the updated values.
   */
  describe('Property 7: Staff updates persist correctly', () => {
    it('should update staff and persist changes', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Initial staff data
            initialName: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            initialStaffType: fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
            initialDesignation: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            // Update data
            updatedName: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            updatedDesignation: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            updatedDepartment: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async ({ initialName, initialStaffType, initialDesignation, updatedName, updatedDesignation, updatedDepartment }) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create initial staff member
            const createResult = await query(
              `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING id`,
              [
                testSchoolId,
                initialName,
                initialStaffType,
                initialDesignation,
                'West Bengal',
                'Kolkata',
                'Kolkata',
                '700001',
                'https://example.com/photo.jpg',
              ]
            );
            const staffId = createResult.rows[0].id;

            try {
              // Update the staff member
              const updateReq = createMockAuthRequestWithParams(
                {
                  name: updatedName,
                  designation: updatedDesignation,
                  department: updatedDepartment,
                },
                { staffId },
                testSchoolId
              ) as AuthRequest;
              const updateRes = createMockResponse() as Response;

              await updateStaff(updateReq, updateRes);

              // Should return 200 status
              expect(updateRes.statusCode).toBe(200);
              expect(updateRes.jsonData.success).toBe(true);

              // Query the staff member to verify changes persisted
              const getReq = createMockAuthRequestWithParams(
                {},
                { staffId },
                testSchoolId
              ) as AuthRequest;
              const getRes = createMockResponse() as Response;

              await getStaff(getReq, getRes);

              // Should return 200 status
              expect(getRes.statusCode).toBe(200);
              expect(getRes.jsonData.success).toBe(true);

              // Updated fields should match
              expect(getRes.jsonData.data.name).toBe(updatedName);
              expect(getRes.jsonData.data.designation).toBe(updatedDesignation);
              expect(getRes.jsonData.data.department).toBe(updatedDepartment);

              // Unchanged fields should remain the same
              expect(getRes.jsonData.data.staff_type).toBe(initialStaffType);
              expect(getRes.jsonData.data.school_id).toBe(testSchoolId);

              // Feature: staff-employee-management, Property 7: Staff updates persist correctly
            } finally {
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should update optional fields correctly', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            phoneNumber: fc.integer({ min: 6000000000, max: 9999999999 }).map(n => `+91${n}`),
            bloodGroup: fc.constantFrom('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
            employeeId: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async ({ phoneNumber, bloodGroup, employeeId }) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create initial staff member without optional fields
            const createResult = await query(
              `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING id`,
              [
                testSchoolId,
                'Test Staff',
                'Teaching',
                'Teacher',
                'West Bengal',
                'Kolkata',
                'Kolkata',
                '700001',
                'https://example.com/photo.jpg',
              ]
            );
            const staffId = createResult.rows[0].id;

            try {
              // Update with optional fields
              const updateReq = createMockAuthRequestWithParams(
                {
                  phone_number: phoneNumber,
                  blood_group: bloodGroup,
                  employee_id: employeeId,
                },
                { staffId },
                testSchoolId
              ) as AuthRequest;
              const updateRes = createMockResponse() as Response;

              await updateStaff(updateReq, updateRes);

              // Should return 200 status
              expect(updateRes.statusCode).toBe(200);
              expect(updateRes.jsonData.success).toBe(true);

              // Query to verify
              const getReq = createMockAuthRequestWithParams(
                {},
                { staffId },
                testSchoolId
              ) as AuthRequest;
              const getRes = createMockResponse() as Response;

              await getStaff(getReq, getRes);

              // Optional fields should be updated
              expect(getRes.jsonData.data.phone_number).toBe(phoneNumber);
              expect(getRes.jsonData.data.blood_group).toBe(bloodGroup);
              expect(getRes.jsonData.data.employee_id).toBe(employeeId);

              // Feature: staff-employee-management, Property 7: Staff updates persist correctly
            } finally {
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject update with invalid data', async () => {
      // Clean up
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Create initial staff member
      const createResult = await query(
        `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          testSchoolId,
          'Test Staff',
          'Teaching',
          'Teacher',
          'West Bengal',
          'Kolkata',
          'Kolkata',
          '700001',
          'https://example.com/photo.jpg',
        ]
      );
      const staffId = createResult.rows[0].id;

      try {
        // Try to update with invalid phone number
        const updateReq = createMockAuthRequestWithParams(
          {
            phone_number: 'invalid-phone',
          },
          { staffId },
          testSchoolId
        ) as AuthRequest;
        const updateRes = createMockResponse() as Response;

        await updateStaff(updateReq, updateRes);

        // Should return 400 status (validation error)
        expect(updateRes.statusCode).toBe(400);
        expect(updateRes.jsonData.success).toBe(false);
        expect(updateRes.jsonData.error.code).toBe('VALIDATION_ERROR');

        // Feature: staff-employee-management, Property 7: Staff updates persist correctly
      } finally {
        await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
      }
    });
  });

  /**
   * Property 8: Staff deletion removes record
   * Validates: Requirements 7.3
   * 
   * For any staff member not in a pending batch, deleting the staff member should succeed,
   * and subsequent queries for that staff ID should return 404 not found.
   */
  describe('Property 8: Staff deletion removes record', () => {
    it('should delete staff and return 404 on subsequent queries', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            staffType: fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
            designation: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          async ({ name, staffType, designation }) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create staff member
            const createResult = await query(
              `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING id`,
              [
                testSchoolId,
                name,
                staffType,
                designation,
                'West Bengal',
                'Kolkata',
                'Kolkata',
                '700001',
                'https://example.com/photo.jpg',
              ]
            );
            const staffId = createResult.rows[0].id;

            try {
              // Verify staff exists before deletion
              const getBeforeReq = createMockAuthRequestWithParams(
                {},
                { staffId },
                testSchoolId
              ) as AuthRequest;
              const getBeforeRes = createMockResponse() as Response;

              await getStaff(getBeforeReq, getBeforeRes);
              expect(getBeforeRes.statusCode).toBe(200);
              expect(getBeforeRes.jsonData.success).toBe(true);

              // Delete the staff member
              const deleteReq = createMockAuthRequestWithParams(
                {},
                { staffId },
                testSchoolId
              ) as AuthRequest;
              const deleteRes = createMockResponse() as Response;

              await deleteStaff(deleteReq, deleteRes);

              // Should return 200 status
              expect(deleteRes.statusCode).toBe(200);
              expect(deleteRes.jsonData.success).toBe(true);

              // Try to query the deleted staff member
              const getAfterReq = createMockAuthRequestWithParams(
                {},
                { staffId },
                testSchoolId
              ) as AuthRequest;
              const getAfterRes = createMockResponse() as Response;

              await getStaff(getAfterReq, getAfterRes);

              // Should return 404 status
              expect(getAfterRes.statusCode).toBe(404);
              expect(getAfterRes.jsonData.success).toBe(false);
              expect(getAfterRes.jsonData.error.code).toBe('STAFF_NOT_FOUND');

              // Verify staff is not in database
              const dbCheck = await query('SELECT * FROM staff WHERE id = $1', [staffId]);
              expect(dbCheck.rows.length).toBe(0);

              // Feature: staff-employee-management, Property 8: Staff deletion removes record
            } finally {
              // Cleanup (in case deletion failed)
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should not allow deletion of non-existent staff', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const deleteReq = createMockAuthRequestWithParams(
        {},
        { staffId: nonExistentId },
        testSchoolId
      ) as AuthRequest;
      const deleteRes = createMockResponse() as Response;

      await deleteStaff(deleteReq, deleteRes);

      // Should return 404 status
      expect(deleteRes.statusCode).toBe(404);
      expect(deleteRes.jsonData.success).toBe(false);
      expect(deleteRes.jsonData.error.code).toBe('STAFF_NOT_FOUND');

      // Feature: staff-employee-management, Property 8: Staff deletion removes record
    });

    it('should not allow deletion of staff from another school', async () => {
      // Clean up
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Create another school
      const otherSchoolResult = await query(
        `INSERT INTO schools (name, email, password_hash, state, city, pincode, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          'Other School',
          `other-${Date.now()}@school.com`,
          'hashed_password',
          'West Bengal',
          'Kolkata',
          '700002',
          'approved',
          true
        ]
      );
      const otherSchoolId = otherSchoolResult.rows[0].id;

      try {
        // Create staff for other school
        const createResult = await query(
          `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            otherSchoolId,
            'Other School Staff',
            'Teaching',
            'Teacher',
            'West Bengal',
            'Kolkata',
            'Kolkata',
            '700002',
            'https://example.com/photo.jpg',
          ]
        );
        const otherStaffId = createResult.rows[0].id;

        // Try to delete other school's staff using test school credentials
        const deleteReq = createMockAuthRequestWithParams(
          {},
          { staffId: otherStaffId },
          testSchoolId
        ) as AuthRequest;
        const deleteRes = createMockResponse() as Response;

        await deleteStaff(deleteReq, deleteRes);

        // Should return 404 status (not found because it doesn't belong to this school)
        expect(deleteRes.statusCode).toBe(404);
        expect(deleteRes.jsonData.success).toBe(false);
        expect(deleteRes.jsonData.error.code).toBe('STAFF_NOT_FOUND');

        // Verify staff still exists in database
        const dbCheck = await query('SELECT * FROM staff WHERE id = $1', [otherStaffId]);
        expect(dbCheck.rows.length).toBe(1);

        // Feature: staff-employee-management, Property 8: Staff deletion removes record
      } finally {
        await query('DELETE FROM staff WHERE school_id = $1', [otherSchoolId]);
        await query('DELETE FROM schools WHERE id = $1', [otherSchoolId]);
      }
    });
  });

  /**
   * Property 9: Staff in pending batches cannot be deleted
   * Validates: Requirements 7.2
   * 
   * For any staff member that is part of a batch with status 'submitted' or 'processing',
   * attempting to delete that staff member should be rejected with an appropriate error.
   */
  describe('Property 9: Staff in pending batches cannot be deleted', () => {
    it('should reject deletion of staff in submitted batch', async () => {
      // Clean up
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Ensure school has required assets
      await query(
        `UPDATE schools SET logo_url = $1, signature_url = $2 WHERE id = $3`,
        ['https://example.com/logo.jpg', 'https://example.com/signature.jpg', testSchoolId]
      );

      // Create staff member
      const createResult = await query(
        `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          testSchoolId,
          'Test Staff',
          'Teaching',
          'Teacher',
          'West Bengal',
          'Kolkata',
          'Kolkata',
          '700001',
          'https://example.com/photo.jpg',
        ]
      );
      const staffId = createResult.rows[0].id;

      try {
        // Create a batch submission with status 'submitted'
        const batchResult = await query(
          `INSERT INTO batch_submissions (school_id, status, submitted_at)
           VALUES ($1, $2, NOW())
           RETURNING id`,
          [testSchoolId, 'submitted']
        );
        const batchId = batchResult.rows[0].id;

        // Add staff to the batch
        await query(
          `INSERT INTO submission_members (submission_id, member_type, member_id)
           VALUES ($1, $2, $3)`,
          [batchId, 'staff', staffId]
        );

        // Try to delete the staff member
        const deleteReq = createMockAuthRequestWithParams(
          {},
          { staffId },
          testSchoolId
        ) as AuthRequest;
        const deleteRes = createMockResponse() as Response;

        await deleteStaff(deleteReq, deleteRes);

        // Should return 409 status (conflict)
        expect(deleteRes.statusCode).toBe(409);
        expect(deleteRes.jsonData.success).toBe(false);
        expect(deleteRes.jsonData.error.code).toBe('STAFF_IN_BATCH');

        // Verify staff still exists in database
        const dbCheck = await query('SELECT * FROM staff WHERE id = $1', [staffId]);
        expect(dbCheck.rows.length).toBe(1);

        // Feature: staff-employee-management, Property 9: Staff in pending batches cannot be deleted
      } finally {
        // Cleanup
        await query('DELETE FROM submission_members WHERE member_id = $1', [staffId]);
        await query('DELETE FROM batch_submissions WHERE school_id = $1', [testSchoolId]);
        await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
      }
    });

    it('should reject deletion of staff in processing batch', async () => {
      // Clean up
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Ensure school has required assets
      await query(
        `UPDATE schools SET logo_url = $1, signature_url = $2 WHERE id = $3`,
        ['https://example.com/logo.jpg', 'https://example.com/signature.jpg', testSchoolId]
      );

      // Create staff member
      const createResult = await query(
        `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          testSchoolId,
          'Test Staff',
          'Teaching',
          'Teacher',
          'West Bengal',
          'Kolkata',
          'Kolkata',
          '700001',
          'https://example.com/photo.jpg',
        ]
      );
      const staffId = createResult.rows[0].id;

      try {
        // Create a batch submission with status 'processing'
        const batchResult = await query(
          `INSERT INTO batch_submissions (school_id, status, submitted_at)
           VALUES ($1, $2, NOW())
           RETURNING id`,
          [testSchoolId, 'processing']
        );
        const batchId = batchResult.rows[0].id;

        // Add staff to the batch
        await query(
          `INSERT INTO submission_members (submission_id, member_type, member_id)
           VALUES ($1, $2, $3)`,
          [batchId, 'staff', staffId]
        );

        // Try to delete the staff member
        const deleteReq = createMockAuthRequestWithParams(
          {},
          { staffId },
          testSchoolId
        ) as AuthRequest;
        const deleteRes = createMockResponse() as Response;

        await deleteStaff(deleteReq, deleteRes);

        // Should return 409 status (conflict)
        expect(deleteRes.statusCode).toBe(409);
        expect(deleteRes.jsonData.success).toBe(false);
        expect(deleteRes.jsonData.error.code).toBe('STAFF_IN_BATCH');

        // Verify staff still exists in database
        const dbCheck = await query('SELECT * FROM staff WHERE id = $1', [staffId]);
        expect(dbCheck.rows.length).toBe(1);

        // Feature: staff-employee-management, Property 9: Staff in pending batches cannot be deleted
      } finally {
        // Cleanup
        await query('DELETE FROM submission_members WHERE member_id = $1', [staffId]);
        await query('DELETE FROM batch_submissions WHERE school_id = $1', [testSchoolId]);
        await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
      }
    });

    it('should allow deletion of staff in completed batch', async () => {
      // Clean up
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Ensure school has required assets
      await query(
        `UPDATE schools SET logo_url = $1, signature_url = $2 WHERE id = $3`,
        ['https://example.com/logo.jpg', 'https://example.com/signature.jpg', testSchoolId]
      );

      // Create staff member
      const createResult = await query(
        `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          testSchoolId,
          'Test Staff',
          'Teaching',
          'Teacher',
          'West Bengal',
          'Kolkata',
          'Kolkata',
          '700001',
          'https://example.com/photo.jpg',
        ]
      );
      const staffId = createResult.rows[0].id;

      try {
        // Create a batch submission with status 'completed'
        const batchResult = await query(
          `INSERT INTO batch_submissions (school_id, status, submitted_at)
           VALUES ($1, $2, NOW())
           RETURNING id`,
          [testSchoolId, 'completed']
        );
        const batchId = batchResult.rows[0].id;

        // Add staff to the batch
        await query(
          `INSERT INTO submission_members (submission_id, member_type, member_id)
           VALUES ($1, $2, $3)`,
          [batchId, 'staff', staffId]
        );

        // Try to delete the staff member
        const deleteReq = createMockAuthRequestWithParams(
          {},
          { staffId },
          testSchoolId
        ) as AuthRequest;
        const deleteRes = createMockResponse() as Response;

        await deleteStaff(deleteReq, deleteRes);

        // Should return 200 status (success - completed batches don't block deletion)
        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.jsonData.success).toBe(true);

        // Verify staff is deleted from database
        const dbCheck = await query('SELECT * FROM staff WHERE id = $1', [staffId]);
        expect(dbCheck.rows.length).toBe(0);

        // Feature: staff-employee-management, Property 9: Staff in pending batches cannot be deleted
      } finally {
        // Cleanup
        await query('DELETE FROM submission_members WHERE member_id = $1', [staffId]);
        await query('DELETE FROM batch_submissions WHERE school_id = $1', [testSchoolId]);
        await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
      }
    });

    it('should allow deletion of staff not in any batch', async () => {
      // Clean up
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Create staff member
      const createResult = await query(
        `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          testSchoolId,
          'Test Staff',
          'Teaching',
          'Teacher',
          'West Bengal',
          'Kolkata',
          'Kolkata',
          '700001',
          'https://example.com/photo.jpg',
        ]
      );
      const staffId = createResult.rows[0].id;

      try {
        // Try to delete the staff member (not in any batch)
        const deleteReq = createMockAuthRequestWithParams(
          {},
          { staffId },
          testSchoolId
        ) as AuthRequest;
        const deleteRes = createMockResponse() as Response;

        await deleteStaff(deleteReq, deleteRes);

        // Should return 200 status (success)
        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.jsonData.success).toBe(true);

        // Verify staff is deleted from database
        const dbCheck = await query('SELECT * FROM staff WHERE id = $1', [staffId]);
        expect(dbCheck.rows.length).toBe(0);

        // Feature: staff-employee-management, Property 9: Staff in pending batches cannot be deleted
      } finally {
        // Cleanup (in case deletion failed)
        await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
      }
    });
  });

  /**
   * Property 21: Staff data isolation by school
   * Validates: Security requirement (implicit in all user stories)
   * 
   * For any two different schools A and B, school A should never be able to access,
   * modify, or delete staff belonging to school B through any API endpoint.
   */
  describe('Property 21: Staff data isolation by school', () => {
    it('should prevent school from accessing another school\'s staff', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            schoolAStaffName: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            schoolBStaffName: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
          }),
          async ({ schoolAStaffName, schoolBStaffName }) => {
            // Clean up
            await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

            // Create another school (School B)
            const schoolBResult = await query(
              `INSERT INTO schools (name, email, password_hash, state, city, pincode, status, email_verified)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING id`,
              [
                'School B',
                `schoolb-${Date.now()}@school.com`,
                'hashed_password',
                'West Bengal',
                'Kolkata',
                '700002',
                'approved',
                true
              ]
            );
            const schoolBId = schoolBResult.rows[0].id;

            try {
              // Create staff for School A (testSchoolId)
              const staffAResult = await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                  testSchoolId,
                  schoolAStaffName,
                  'Teaching',
                  'Teacher',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700001',
                  'https://example.com/photo-a.jpg',
                ]
              );
              const staffAId = staffAResult.rows[0].id;

              // Create staff for School B
              const staffBResult = await query(
                `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                  schoolBId,
                  schoolBStaffName,
                  'Teaching',
                  'Teacher',
                  'West Bengal',
                  'Kolkata',
                  'Kolkata',
                  '700002',
                  'https://example.com/photo-b.jpg',
                ]
              );
              const staffBId = staffBResult.rows[0].id;

              // Test 1: School A tries to get School B's staff
              const getReq = createMockAuthRequestWithParams(
                {},
                { staffId: staffBId },
                testSchoolId
              ) as AuthRequest;
              const getRes = createMockResponse() as Response;

              await getStaff(getReq, getRes);

              // Should return 403 or 404 (access denied)
              expect([403, 404]).toContain(getRes.statusCode);
              expect(getRes.jsonData.success).toBe(false);

              // Test 2: School A tries to update School B's staff
              const updateReq = createMockAuthRequestWithParams(
                { name: 'Hacked Name' },
                { staffId: staffBId },
                testSchoolId
              ) as AuthRequest;
              const updateRes = createMockResponse() as Response;

              await updateStaff(updateReq, updateRes);

              // Should return 404 (not found because it doesn't belong to this school)
              expect(updateRes.statusCode).toBe(404);
              expect(updateRes.jsonData.success).toBe(false);

              // Verify School B's staff was not modified
              const verifyUpdate = await query('SELECT name FROM staff WHERE id = $1', [staffBId]);
              expect(verifyUpdate.rows[0].name).toBe(schoolBStaffName);

              // Test 3: School A tries to delete School B's staff
              const deleteReq = createMockAuthRequestWithParams(
                {},
                { staffId: staffBId },
                testSchoolId
              ) as AuthRequest;
              const deleteRes = createMockResponse() as Response;

              await deleteStaff(deleteReq, deleteRes);

              // Should return 404 (not found because it doesn't belong to this school)
              expect(deleteRes.statusCode).toBe(404);
              expect(deleteRes.jsonData.success).toBe(false);

              // Verify School B's staff still exists
              const verifyDelete = await query('SELECT * FROM staff WHERE id = $1', [staffBId]);
              expect(verifyDelete.rows.length).toBe(1);

              // Test 4: School A's staff list should not include School B's staff
              const listReq = createMockAuthRequestWithQuery({}, testSchoolId) as AuthRequest;
              const listRes = createMockResponse() as Response;

              await getStaffList(listReq, listRes);

              expect(listRes.statusCode).toBe(200);
              expect(listRes.jsonData.success).toBe(true);

              // Should only return School A's staff
              expect(listRes.jsonData.data.length).toBe(1);
              expect(listRes.jsonData.data[0].id).toBe(staffAId);
              expect(listRes.jsonData.data[0].school_id).toBe(testSchoolId);

              // Should not include School B's staff
              const returnedIds = listRes.jsonData.data.map((s: any) => s.id);
              expect(returnedIds).not.toContain(staffBId);

              // Feature: staff-employee-management, Property 21: Staff data isolation by school
            } finally {
              // Cleanup
              await query('DELETE FROM staff WHERE school_id = $1', [schoolBId]);
              await query('DELETE FROM schools WHERE id = $1', [schoolBId]);
              await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should ensure staff list filtering by school_id is always applied', async () => {
      // Clean up
      await query('DELETE FROM staff WHERE school_id = $1', [testSchoolId]);

      // Create multiple schools with staff
      const schoolIds: string[] = [];
      const staffCounts: number[] = [];

      for (let i = 0; i < 3; i++) {
        const schoolResult = await query(
          `INSERT INTO schools (name, email, password_hash, state, city, pincode, status, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            `School ${i}`,
            `school${i}-${Date.now()}@school.com`,
            'hashed_password',
            'West Bengal',
            'Kolkata',
            `70000${i}`,
            'approved',
            true
          ]
        );
        const schoolId = schoolResult.rows[0].id;
        schoolIds.push(schoolId);

        // Create random number of staff for each school
        const staffCount = Math.floor(Math.random() * 5) + 1;
        staffCounts.push(staffCount);

        for (let j = 0; j < staffCount; j++) {
          await query(
            `INSERT INTO staff (school_id, name, staff_type, designation, state, district, city, pincode, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              schoolId,
              `Staff ${i}-${j}`,
              'Teaching',
              'Teacher',
              'West Bengal',
              'Kolkata',
              'Kolkata',
              `70000${i}`,
              `https://example.com/photo-${i}-${j}.jpg`,
            ]
          );
        }
      }

      try {
        // Query staff list for each school and verify isolation
        for (let i = 0; i < schoolIds.length; i++) {
          const req = createMockAuthRequestWithQuery({}, schoolIds[i]) as AuthRequest;
          const res = createMockResponse() as Response;

          await getStaffList(req, res);

          expect(res.statusCode).toBe(200);
          expect(res.jsonData.success).toBe(true);

          // Should return exactly the staff count for this school
          expect(res.jsonData.data.length).toBe(staffCounts[i]);
          expect(res.jsonData.total).toBe(staffCounts[i]);

          // All returned staff should belong to this school only
          for (const staff of res.jsonData.data) {
            expect(staff.school_id).toBe(schoolIds[i]);
          }
        }

        // Feature: staff-employee-management, Property 21: Staff data isolation by school
      } finally {
        // Cleanup
        for (const schoolId of schoolIds) {
          await query('DELETE FROM staff WHERE school_id = $1', [schoolId]);
          await query('DELETE FROM schools WHERE id = $1', [schoolId]);
        }
      }
    });
  });

