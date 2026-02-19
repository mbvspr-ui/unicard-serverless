import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { staffSchema } from './staff';

/**
 * Property-Based Tests for Staff Validator
 * Feature: staff-employee-management
 * 
 * These tests validate that the staff validator correctly rejects invalid data
 * across a wide range of inputs using property-based testing.
 */

describe('Staff Validator - Property-Based Tests', () => {
  /**
   * Property 3: Input validation rejects invalid data
   * Validates: Requirements 1.4, 2.1, 6.3
   * 
   * For any staff data with invalid fields (phone number not matching +91XXXXXXXXXX format,
   * pincode not 6 digits, staff_type not in allowed enum, missing required fields),
   * the API should reject the request with a validation error specifying which fields are invalid.
   */
  describe('Property 3: Input validation rejects invalid data', () => {
    it('should reject invalid phone numbers', () => {
      fc.assert(
        fc.property(
          // Generate invalid phone numbers
          fc.oneof(
            fc.string().filter(s => !/^\+91[6-9][0-9]{9}$/.test(s)), // Any string that doesn't match pattern
            fc.constant(''), // Empty string
            fc.constant('+91123456789'), // Invalid starting digit (1)
            fc.constant('+919876543'), // Too short
            fc.constant('+9198765432100'), // Too long
            fc.constant('9876543210'), // Missing +91
            fc.constant('+91 9876543210'), // Has space
          ),
          (invalidPhone) => {
            const staffData = {
              name: 'Test Staff',
              staff_type: 'Teaching' as const,
              designation: 'Teacher',
              state: 'West Bengal',
              district: 'Kolkata',
              city: 'Kolkata',
              pincode: '700001',
              phone_number: invalidPhone,
            };

            const result = staffSchema.safeParse(staffData);
            
            // Should fail validation
            expect(result.success).toBe(false);
            if (!result.success) {
              // Should have error for phone_number field
              const phoneError = result.error.errors.find(e => 
                e.path.includes('phone_number')
              );
              expect(phoneError).toBeDefined();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject invalid pincodes', () => {
      fc.assert(
        fc.property(
          // Generate invalid pincodes
          fc.oneof(
            fc.string().filter(s => !/^[0-9]{6}$/.test(s)), // Any string that doesn't match pattern
            fc.constant(''), // Empty string
            fc.constant('12345'), // Too short
            fc.constant('1234567'), // Too long
            fc.constant('12345a'), // Contains letter
            fc.constant('12 345'), // Contains space
          ),
          (invalidPincode) => {
            const staffData = {
              name: 'Test Staff',
              staff_type: 'Teaching' as const,
              designation: 'Teacher',
              state: 'West Bengal',
              district: 'Kolkata',
              city: 'Kolkata',
              pincode: invalidPincode,
            };

            const result = staffSchema.safeParse(staffData);
            
            // Should fail validation
            expect(result.success).toBe(false);
            if (!result.success) {
              // Should have error for pincode field
              const pincodeError = result.error.errors.find(e => 
                e.path.includes('pincode')
              );
              expect(pincodeError).toBeDefined();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject invalid staff_type values', () => {
      fc.assert(
        fc.property(
          // Generate invalid staff types
          fc.string().filter(s => 
            !['Teaching', 'Non-Teaching', 'Administrative', 'Support'].includes(s)
          ),
          (invalidStaffType) => {
            const staffData = {
              name: 'Test Staff',
              staff_type: invalidStaffType,
              designation: 'Teacher',
              state: 'West Bengal',
              district: 'Kolkata',
              city: 'Kolkata',
              pincode: '700001',
            };

            const result = staffSchema.safeParse(staffData);
            
            // Should fail validation
            expect(result.success).toBe(false);
            if (!result.success) {
              // Should have error for staff_type field
              const staffTypeError = result.error.errors.find(e => 
                e.path.includes('staff_type')
              );
              expect(staffTypeError).toBeDefined();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject missing required fields', () => {
      fc.assert(
        fc.property(
          // Generate data with one required field missing
          fc.constantFrom('name', 'staff_type', 'designation', 'state', 'district', 'city', 'pincode'),
          (fieldToOmit) => {
            const fullData = {
              name: 'Test Staff',
              staff_type: 'Teaching' as const,
              designation: 'Teacher',
              state: 'West Bengal',
              district: 'Kolkata',
              city: 'Kolkata',
              pincode: '700001',
            };

            // Remove the field
            const incompleteData = { ...fullData };
            delete (incompleteData as any)[fieldToOmit];

            const result = staffSchema.safeParse(incompleteData);
            
            // Should fail validation
            expect(result.success).toBe(false);
            if (!result.success) {
              // Should have error for the missing field
              const fieldError = result.error.errors.find(e => 
                e.path.includes(fieldToOmit)
              );
              expect(fieldError).toBeDefined();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject invalid gender values', () => {
      fc.assert(
        fc.property(
          // Generate invalid gender values
          fc.string().filter(s => !['Male', 'Female', 'Other'].includes(s)),
          (invalidGender) => {
            const staffData = {
              name: 'Test Staff',
              staff_type: 'Teaching' as const,
              designation: 'Teacher',
              state: 'West Bengal',
              district: 'Kolkata',
              city: 'Kolkata',
              pincode: '700001',
              gender: invalidGender,
            };

            const result = staffSchema.safeParse(staffData);
            
            // Should fail validation
            expect(result.success).toBe(false);
            if (!result.success) {
              // Should have error for gender field
              const genderError = result.error.errors.find(e => 
                e.path.includes('gender')
              );
              expect(genderError).toBeDefined();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject invalid blood_group values', () => {
      fc.assert(
        fc.property(
          // Generate invalid blood group values
          fc.string().filter(s => 
            !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(s)
          ),
          (invalidBloodGroup) => {
            const staffData = {
              name: 'Test Staff',
              staff_type: 'Teaching' as const,
              designation: 'Teacher',
              state: 'West Bengal',
              district: 'Kolkata',
              city: 'Kolkata',
              pincode: '700001',
              blood_group: invalidBloodGroup,
            };

            const result = staffSchema.safeParse(staffData);
            
            // Should fail validation
            expect(result.success).toBe(false);
            if (!result.success) {
              // Should have error for blood_group field
              const bloodGroupError = result.error.errors.find(e => 
                e.path.includes('blood_group')
              );
              expect(bloodGroupError).toBeDefined();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject empty strings for required fields', () => {
      fc.assert(
        fc.property(
          // Test each required string field with empty string
          fc.constantFrom('name', 'designation', 'state', 'district', 'city'),
          (fieldToEmpty) => {
            const staffData = {
              name: 'Test Staff',
              staff_type: 'Teaching' as const,
              designation: 'Teacher',
              state: 'West Bengal',
              district: 'Kolkata',
              city: 'Kolkata',
              pincode: '700001',
            };

            // Set the field to empty string
            (staffData as any)[fieldToEmpty] = '';

            const result = staffSchema.safeParse(staffData);
            
            // Should fail validation
            expect(result.success).toBe(false);
            if (!result.success) {
              // Should have error for the empty field
              const fieldError = result.error.errors.find(e => 
                e.path.includes(fieldToEmpty)
              );
              expect(fieldError).toBeDefined();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accept valid staff data', () => {
      fc.assert(
        fc.property(
          // Generate valid staff data
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 255 }),
            staff_type: fc.constantFrom('Teaching', 'Non-Teaching', 'Administrative', 'Support'),
            designation: fc.string({ minLength: 1, maxLength: 100 }),
            state: fc.string({ minLength: 1, maxLength: 100 }),
            district: fc.string({ minLength: 1, maxLength: 100 }),
            city: fc.string({ minLength: 1, maxLength: 100 }),
            pincode: fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
            photo_url: fc.webUrl(), // Now required
          }),
          (validStaffData) => {
            const result = staffSchema.safeParse(validStaffData);
            
            // Should pass validation
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
