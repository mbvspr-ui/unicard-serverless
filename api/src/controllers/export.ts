import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { executeQuery, executeQueryOne } from '../utils/db-helpers.js';
import { createObjectCsvWriter } from 'csv-writer';
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
        s.name, s.father_name, s.mother_name, s.class, s.section,
        s.roll_number, s.student_id, s.date_of_birth, s.gender,
        s.phone_number, s.blood_group, s.address, s.state,
        s.district, s.city, s.pincode, s.photo_url
      FROM students s
      JOIN submission_students ss ON s.id = ss.student_id
      WHERE ss.submission_id = $1
      ORDER BY s.class, s.section, s.roll_number, s.name
    `;
    const students = await executeQuery<any>(studentsSql, [batchId]);

    if (students.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_STUDENTS',
          message: 'No students found in this batch',
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
        { id: 'name', title: 'Student Name' },
        { id: 'father_name', title: 'Father Name' },
        { id: 'mother_name', title: 'Mother Name' },
        { id: 'class', title: 'Class' },
        { id: 'section', title: 'Section' },
        { id: 'roll_number', title: 'Roll Number' },
        { id: 'student_id', title: 'Student ID' },
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
    const formattedStudents = students.map(student => ({
      ...student,
      // Format date as DD/MM/YYYY
      date_of_birth: student.date_of_birth 
        ? new Date(student.date_of_birth).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '',
      // Format phone number as text to prevent scientific notation
      phone_number: student.phone_number ? `'${student.phone_number}` : '',
    }));

    // Write CSV
    await csvWriter.writeRecords(formattedStudents);

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
      SELECT s.id, s.name, s.student_id, s.roll_number, s.photo_url
      FROM students s
      JOIN submission_students ss ON s.id = ss.student_id
      WHERE ss.submission_id = $1 AND s.photo_url IS NOT NULL
      ORDER BY s.name
    `;
    const students = await executeQuery<any>(studentsSql, [batchId]);

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
          const filename = `${student.student_id || student.id}_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
          archive.append(photoBuffer, { name: `student-photos/${filename}` });
          successCount++;
        }
      } catch (error) {
        console.error(`Error adding photo for student ${student.id}:`, error);
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
