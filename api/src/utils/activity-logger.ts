import { insertOne } from './db-helpers.js';

export type ActivityType = 
  | 'student_added'
  | 'student_updated'
  | 'student_deleted'
  | 'batch_submitted'
  | 'profile_updated'
  | 'logo_uploaded'
  | 'signature_uploaded'
  | 'school_registered'
  | 'school_login';

export type EntityType = 'student' | 'batch' | 'profile' | 'school';

interface LogActivityParams {
  schoolId: string;
  activityType: ActivityType;
  entityType: EntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Log an activity to the activity_log table
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    console.log('📝 Logging activity:', params.activityType, '-', params.description);
    await insertOne('activity_log', {
      school_id: params.schoolId,
      activity_type: params.activityType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      description: params.description,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
    console.log('✅ Activity logged successfully');
  } catch (error) {
    // Don't throw errors for activity logging - it's not critical
    console.error('❌ Failed to log activity:', error);
  }
}
