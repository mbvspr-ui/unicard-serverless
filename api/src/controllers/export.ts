import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { executeQuery, executeQueryOne } from '../utils/db-helpers.js';
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import archiver from 'archiver';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'unicard-files';

/**
 * Download batch data as CSV
 * GET /api/admin/batches/:batchId/csv
 */
export const downloadBatchCSV = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_ID_MISSING',
          message: 'Batch ID is required',
        },
      });
      return;
    }

    // Get batch and verify it exists
    const batchSql = `
      SELECT bs.*, s.name as school_name
      FROM batch_submissions bs
      JOIN schools s ON bs.school_id = s.id
      WHERE bs.id = $1
    `;
    const batch = await executeQueryOne<any>(batchSql, [batchId]);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch submission not found',
        },
      });
      return;
    }

    // Get students in this batch
    const studentsSql = `
      SELECT 
        'Student' as type,
        s.name, s.father_name, s.mother_name, s.class, s.section,
        s.roll_number, s.student_id as id_number, s.date_of_birth, s.gender,
        s.phone_number, s.blood_group, s.address, s.state,
        s.district, s.city, s.pincode, s.photo_url,
        NULL as designation, NULL as department, NULL as employee_id
      FROM students s
      JOIN submission_members sm ON s.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'student'
      ORDER BY s.class, s.section, s.roll_number, s.name
    `;
    const students = await executeQuery<any>(studentsSql, [batchId]);

    // Get staff in this batch
    const staffSql = `
      SELECT 
        'Staff' as type,
        st.name, st.father_spouse_name as father_name, NULL as mother_name,
        NULL as class, NULL as section, NULL as roll_number,
        st.employee_id as id_number, st.date_of_birth, st.gender,
        st.phone_number, st.blood_group, st.address, st.state,
        st.district, st.city, st.pincode, st.photo_url,
        st.designation, st.department, st.employee_id
      FROM staff st
      JOIN submission_members sm ON st.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'staff'
      ORDER BY st.name
    `;
    const staff = await executeQuery<any>(staffSql, [batchId]);

    // Combine students and staff
    const allMembers = [...students, ...staff];

    if (allMembers.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_MEMBERS',
          message: 'No members found in this batch',
        },
      });
      return;
    }

    // Create temporary file path
    const tempDir = os.tmpdir();
    const filename = `batch_${batchId}_${Date.now()}.csv`;
    const filepath = path.join(tempDir, filename);

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'type', title: 'Type' },
        { id: 'name', title: 'Name' },
        { id: 'father_name', title: 'Father/Spouse Name' },
        { id: 'mother_name', title: 'Mother Name' },
        { id: 'class', title: 'Class' },
        { id: 'section', title: 'Section' },
        { id: 'roll_number', title: 'Roll Number' },
        { id: 'id_number', title: 'Student ID / Employee ID' },
        { id: 'designation', title: 'Designation' },
        { id: 'department', title: 'Department' },
        { id: 'date_of_birth', title: 'Date of Birth' },
        { id: 'gender', title: 'Gender' },
        { id: 'phone_number', title: 'Phone Number' },
        { id: 'blood_group', title: 'Blood Group' },
        { id: 'address', title: 'Address' },
        { id: 'state', title: 'State' },
        { id: 'district', title: 'District' },
        { id: 'city', title: 'City' },
        { id: 'pincode', title: 'Pincode' },
      ],
    });

    // Format data for CSV
    const formattedMembers = allMembers.map(member => ({
      ...member,
      // Format date as DD/MM/YYYY
      date_of_birth: member.date_of_birth 
        ? new Date(member.date_of_birth).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '',
      // Format phone number as text to prevent scientific notation
      phone_number: member.phone_number ? `'${member.phone_number}` : '',
    }));

    // Write CSV
    await csvWriter.writeRecords(formattedMembers);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="batch_${batch.school_name}_${batchId}.csv"`
    );

    // Stream file to response
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    // Clean up temp file after streaming
    fileStream.on('end', () => {
      fs.unlink(filepath, (err) => {
        if (err) console.error('Error deleting temp CSV file:', err);
      });
    });
  } catch (error) {
    console.error('Download batch CSV error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to generate CSV export',
      },
    });
  }
};

/**
 * Download staff data as CSV
 * GET /api/admin/batches/:batchId/staff-csv
 */
export const downloadStaffCSV = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_ID_MISSING',
          message: 'Batch ID is required',
        },
      });
      return;
    }

    // Get batch and verify it exists
    const batchSql = `
      SELECT bs.*, s.name as school_name
      FROM batch_submissions bs
      JOIN schools s ON bs.school_id = s.id
      WHERE bs.id = $1
    `;
    const batch = await executeQueryOne<any>(batchSql, [batchId]);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch submission not found',
        },
      });
      return;
    }

    // Get staff in this batch
    const staffSql = `
      SELECT 
        'Staff' as type,
        st.name, st.father_spouse_name, st.date_of_birth, st.gender,
        st.phone_number, st.blood_group, st.address, st.state,
        st.district, st.city, st.pincode,
        st.designation, st.department, st.employee_id, st.staff_type,
        st.date_of_joining, st.qualification, st.experience_years
      FROM staff st
      JOIN submission_members sm ON st.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'staff'
      ORDER BY st.name
    `;
    const staff = await executeQuery<any>(staffSql, [batchId]);

    if (staff.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_STAFF',
          message: 'No staff found in this batch',
        },
      });
      return;
    }

    // Create temporary file path
    const tempDir = os.tmpdir();
    const filename = `batch_${batchId}_staff_${Date.now()}.csv`;
    const filepath = path.join(tempDir, filename);

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'type', title: 'Type' },
        { id: 'name', title: 'Name' },
        { id: 'father_spouse_name', title: 'Father/Spouse Name' },
        { id: 'employee_id', title: 'Employee ID' },
        { id: 'staff_type', title: 'Staff Type' },
        { id: 'designation', title: 'Designation' },
        { id: 'department', title: 'Department' },
        { id: 'date_of_birth', title: 'Date of Birth' },
        { id: 'gender', title: 'Gender' },
        { id: 'phone_number', title: 'Phone Number' },
        { id: 'blood_group', title: 'Blood Group' },
        { id: 'address', title: 'Address' },
        { id: 'state', title: 'State' },
        { id: 'district', title: 'District' },
        { id: 'city', title: 'City' },
        { id: 'pincode', title: 'Pincode' },
        { id: 'date_of_joining', title: 'Date of Joining' },
        { id: 'qualification', title: 'Qualification' },
        { id: 'experience_years', title: 'Experience (Years)' },
      ],
    });

    // Format data for CSV
    const formattedStaff = staff.map(member => ({
      ...member,
      // Format dates as DD/MM/YYYY
      date_of_birth: member.date_of_birth 
        ? new Date(member.date_of_birth).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '',
      date_of_joining: member.date_of_joining 
        ? new Date(member.date_of_joining).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '',
      // Format phone number as text to prevent scientific notation
      phone_number: member.phone_number ? `'${member.phone_number}` : '',
    }));

    // Write CSV
    await csvWriter.writeRecords(formattedStaff);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="batch_${batch.school_name}_staff_${batchId}.csv"`
    );

    // Stream file to response
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    // Clean up temp file after streaming
    fileStream.on('end', () => {
      fs.unlink(filepath, (err) => {
        if (err) console.error('Error deleting temp CSV file:', err);
      });
    });
  } catch (error) {
    console.error('Download staff CSV error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to generate staff CSV export',
      },
    });
  }
};

/**
 * Download batch photos as ZIP
 * GET /api/admin/batches/:batchId/photos
 */
export const downloadBatchPhotos = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_ID_MISSING',
          message: 'Batch ID is required',
        },
      });
      return;
    }

    // Get batch with school info
    const batchSql = `
      SELECT 
        bs.*, 
        s.name as school_name,
        s.logo_url,
        s.signature_url
      FROM batch_submissions bs
      JOIN schools s ON bs.school_id = s.id
      WHERE bs.id = $1
    `;
    const batch = await executeQueryOne<any>(batchSql, [batchId]);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch submission not found',
        },
      });
      return;
    }

    // Get students with photos
    const studentsSql = `
      SELECT s.id, s.name, s.student_id, s.roll_number, s.photo_url, 'student' as member_type
      FROM students s
      JOIN submission_members sm ON s.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'student' AND s.photo_url IS NOT NULL
      ORDER BY s.name
    `;
    const students = await executeQuery<any>(studentsSql, [batchId]);

    // Get staff with photos
    const staffSql = `
      SELECT st.id, st.name, st.employee_id, st.designation, st.photo_url, 'staff' as member_type
      FROM staff st
      JOIN submission_members sm ON st.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'staff' AND st.photo_url IS NOT NULL
      ORDER BY st.name
    `;
    const staff = await executeQuery<any>(staffSql, [batchId]);

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="batch_${batch.school_name}_${batchId}_photos.zip"`
    );

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'ARCHIVE_ERROR',
            message: 'Failed to create ZIP archive',
          },
        });
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Helper function to download file from R2
    const downloadFromR2 = async (fileUrl: string): Promise<Buffer> => {
      try {
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1); // Remove leading slash

        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });

        const response = await r2Client.send(command);
        const stream = response.Body as Readable;

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      } catch (error) {
        console.error(`Error downloading file ${fileUrl}:`, error);
        throw error;
      }
    };

    // Add school assets folder
    try {
      if (batch.logo_url) {
        const logoBuffer = await downloadFromR2(batch.logo_url);
        archive.append(logoBuffer, { name: 'school-assets/logo.png' });
      }

      if (batch.signature_url) {
        const signatureBuffer = await downloadFromR2(batch.signature_url);
        archive.append(signatureBuffer, {
          name: 'school-assets/signature.png',
        });
      }
    } catch (error) {
      console.error('Error adding school assets:', error);
      // Continue even if school assets fail
    }

    // Add student photos
    let successCount = 0;
    let failCount = 0;

    for (const student of students) {
      try {
        if (student.photo_url) {
          const photoBuffer = await downloadFromR2(student.photo_url);
          // Photo field contains the database id (UUID), no extension
          const photoNumber = student.id;
          const filename = `${photoNumber}.png`;
          archive.append(photoBuffer, { name: `student-photos/${filename}` });
          successCount++;
        }
      } catch (error) {
        console.error(`Error adding photo for student ${student.id}:`, error);
        failCount++;
        // Continue with other photos
      }
    }

    // Add staff photos
    for (const staffMember of staff) {
      try {
        if (staffMember.photo_url) {
          const photoBuffer = await downloadFromR2(staffMember.photo_url);
          // Photo field contains the database id (UUID), no extension
          const photoNumber = staffMember.id;
          const filename = `${photoNumber}.png`;
          archive.append(photoBuffer, { name: `staff-photos/${filename}` });
          successCount++;
        }
      } catch (error) {
        console.error(`Error adding photo for staff ${staffMember.id}:`, error);
        failCount++;
        // Continue with other photos
      }
    }

    // Add a summary file
    const summary = `Batch Export Summary
=====================
Batch ID: ${batchId}
School: ${batch.school_name}
Export Date: ${new Date().toISOString()}
Total Students: ${students.length}
Total Staff: ${staff.length}
Photos Included: ${successCount}
Photos Failed: ${failCount}
`;
    archive.append(summary, { name: 'README.txt' });

    // Finalize archive
    await archive.finalize();
  } catch (error) {
    console.error('Download batch photos error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to generate photo ZIP export',
        },
      });
    }
  }
};

/**
 * Download batch data as Excel
 * GET /api/admin/batches/:batchId/excel
 */
export const downloadBatchExcel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_ID_MISSING',
          message: 'Batch ID is required',
        },
      });
      return;
    }

    // Get batch and verify it exists
    const batchSql = `
      SELECT bs.*, s.name as school_name
      FROM batch_submissions bs
      JOIN schools s ON bs.school_id = s.id
      WHERE bs.id = $1
    `;
    const batch = await executeQueryOne<any>(batchSql, [batchId]);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch submission not found',
        },
      });
      return;
    }

    // Get students in this batch
    const studentsSql = `
      SELECT 
        s.id,
        s.name, 
        s.father_name, 
        s.mother_name, 
        s.class, 
        s.section,
        s.roll_number, 
        s.student_id as id_number, 
        s.date_of_birth, 
        s.gender,
        s.phone_number, 
        s.blood_group, 
        s.address, 
        s.state,
        s.district, 
        s.city, 
        s.pincode,
        s.id as photo
      FROM students s
      JOIN submission_members sm ON s.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'student'
      ORDER BY s.class, s.section, s.roll_number, s.name
    `;
    const students = await executeQuery<any>(studentsSql, [batchId]);

    // Get staff in this batch
    const staffSql = `
      SELECT 
        st.id,
        'Staff' as type,
        st.name, 
        st.father_spouse_name as father_name, 
        NULL as mother_name,
        NULL as class, 
        NULL as section, 
        NULL as roll_number,
        st.employee_id as id_number, 
        st.date_of_birth, 
        st.gender,
        st.phone_number, 
        st.blood_group, 
        st.address, 
        st.state,
        st.district, 
        st.city, 
        st.pincode,
        st.designation, 
        st.department, 
        st.id as photo
      FROM staff st
      JOIN submission_members sm ON st.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'staff'
      ORDER BY st.name
    `;
    const staff = await executeQuery<any>(staffSql, [batchId]);

    // Combine students and staff
    const allMembers = [...students, ...staff];

    if (allMembers.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_MEMBERS',
          message: 'No members found in this batch',
        },
      });
      return;
    }

    // Format data for Excel
    const formattedMembers = allMembers.map(member => ({
      ...member,
      // Format date as DD/MM/YYYY
      date_of_birth: member.date_of_birth 
        ? new Date(member.date_of_birth).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '',
      // Format phone number as text to prevent scientific notation
      phone_number: member.phone_number ? `'${member.phone_number}` : '',
      // Photo field contains only the number (student_id or employee_id)
      photo: member.photo || '',
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedMembers);

    // Define headers in order
    const headers = [
      'type',
      'name',
      'father_name',
      'mother_name',
      'class',
      'section',
      'roll_number',
      'id_number',
      'designation',
      'department',
      'date_of_birth',
      'gender',
      'phone_number',
      'blood_group',
      'address',
      'state',
      'district',
      'city',
      'pincode',
      'photo',
    ];

    // Set column order
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_col(C) + '1';
      const cell = worksheet[cellRef];
      if (cell && cell.t === 's') {
        // Reorder columns by creating new sheet with correct order
      }
    }

    // Create ordered data
    const orderedData = formattedMembers.map(member => {
      const ordered: any = {};
      headers.forEach(header => {
        ordered[header] = member[header];
      });
      return ordered;
    });

    // Create new worksheet with ordered columns
    const orderedWorksheet = XLSX.utils.json_to_sheet(orderedData, { header: headers });

    // Set column widths
    const wscols = [
      { wch: 10 }, // type
      { wch: 30 }, // name
      { wch: 30 }, // father_name
      { wch: 30 }, // mother_name
      { wch: 10 }, // class
      { wch: 10 }, // section
      { wch: 10 }, // roll_number
      { wch: 20 }, // id_number
      { wch: 20 }, // designation
      { wch: 20 }, // department
      { wch: 12 }, // date_of_birth
      { wch: 10 }, // gender
      { wch: 15 }, // phone_number
      { wch: 10 }, // blood_group
      { wch: 50 }, // address
      { wch: 20 }, // state
      { wch: 20 }, // district
      { wch: 20 }, // city
      { wch: 10 }, // pincode
      { wch: 20 }, // photo
    ];
    orderedWorksheet['!cols'] = wscols;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, orderedWorksheet, 'Batch Members');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="batch_${batch.school_name}_${batchId}.xlsx"`
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error('Download batch Excel error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to generate Excel export',
      },
    });
  }
};

/**
 * Download staff data as Excel
 * GET /api/admin/batches/:batchId/staff-excel
 */
export const downloadStaffExcel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_ID_MISSING',
          message: 'Batch ID is required',
        },
      });
      return;
    }

    // Get batch and verify it exists
    const batchSql = `
      SELECT bs.*, s.name as school_name
      FROM batch_submissions bs
      JOIN schools s ON bs.school_id = s.id
      WHERE bs.id = $1
    `;
    const batch = await executeQueryOne<any>(batchSql, [batchId]);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: 'Batch submission not found',
        },
      });
      return;
    }

    // Get staff in this batch
    const staffSql = `
      SELECT 
        st.id,
        st.name, 
        st.father_spouse_name, 
        st.date_of_birth, 
        st.gender,
        st.phone_number, 
        st.blood_group, 
        st.address, 
        st.state,
        st.district, 
        st.city, 
        st.pincode,
        st.designation, 
        st.department, 
        st.employee_id,
        st.staff_type,
        st.date_of_joining, 
        st.qualification, 
        st.experience_years,
        st.id as photo
      FROM staff st
      JOIN submission_members sm ON st.id = sm.member_id
      WHERE sm.submission_id = $1 AND sm.member_type = 'staff'
      ORDER BY st.name
    `;
    const staff = await executeQuery<any>(staffSql, [batchId]);

    if (staff.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_STAFF',
          message: 'No staff found in this batch',
        },
      });
      return;
    }

    // Format data for Excel
    const formattedStaff = staff.map(member => ({
      ...member,
      // Format dates as DD/MM/YYYY
      date_of_birth: member.date_of_birth 
        ? new Date(member.date_of_birth).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '',
      date_of_joining: member.date_of_joining 
        ? new Date(member.date_of_joining).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '',
      // Format phone number as text to prevent scientific notation
      phone_number: member.phone_number ? `'${member.phone_number}` : '',
      // Photo field contains the database id (UUID), no extension
      photo: member.id || '',
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Define headers in order
    const headers = [
      'name',
      'father_spouse_name',
      'employee_id',
      'staff_type',
      'designation',
      'department',
      'date_of_birth',
      'gender',
      'phone_number',
      'blood_group',
      'address',
      'state',
      'district',
      'city',
      'pincode',
      'date_of_joining',
      'qualification',
      'experience_years',
      'photo',
    ];

    // Create ordered data
    const orderedData = formattedStaff.map(member => {
      const ordered: any = {};
      headers.forEach(header => {
        ordered[header] = member[header];
      });
      return ordered;
    });

    // Create worksheet with ordered columns
    const worksheet = XLSX.utils.json_to_sheet(orderedData, { header: headers });

    // Set column widths
    const wscols = [
      { wch: 30 }, // name
      { wch: 30 }, // father_spouse_name
      { wch: 20 }, // employee_id
      { wch: 20 }, // staff_type
      { wch: 20 }, // designation
      { wch: 20 }, // department
      { wch: 12 }, // date_of_birth
      { wch: 10 }, // gender
      { wch: 15 }, // phone_number
      { wch: 10 }, // blood_group
      { wch: 50 }, // address
      { wch: 20 }, // state
      { wch: 20 }, // district
      { wch: 20 }, // city
      { wch: 10 }, // pincode
      { wch: 12 }, // date_of_joining
      { wch: 20 }, // qualification
      { wch: 15 }, // experience_years
      { wch: 20 }, // photo
    ];
    worksheet['!cols'] = wscols;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="batch_${batch.school_name}_${batchId}_staff.xlsx"`
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error('Download staff Excel error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to generate staff Excel export',
      },
    });
  }
};
