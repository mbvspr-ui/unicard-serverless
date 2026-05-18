import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { executeQuery, executeQueryOne, query } from '../utils/db-helpers.js';
import {
  createSystemOptionSchema,
  updateSystemOptionSchema,
  SystemOptionType,
} from '../validators/systemOptions.js';

interface SystemOption {
  id: string;
  option_type: SystemOptionType;
  value: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const optionTypes: SystemOptionType[] = ['class', 'section'];

const groupOptions = (options: SystemOption[]) => ({
  classes: options.filter((option) => option.option_type === 'class'),
  sections: options.filter((option) => option.option_type === 'section'),
});

const logOptionChange = async (
  req: AuthRequest,
  actionType: string,
  option: Partial<SystemOption> & { id?: string; option_type?: string; value?: string },
  previous?: Partial<SystemOption> | null
) => {
  try {
    await query(
      `
        INSERT INTO admin_audit_log (admin_id, action_type, entity_type, entity_id, description, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        req.user?.userId,
        actionType,
        'system_option',
        option.id || null,
        `${actionType} ${option.option_type || previous?.option_type || 'system'} option: ${option.value || previous?.value || ''}`,
        JSON.stringify({ previous: previous || null, current: option }),
      ]
    );
  } catch (error) {
    console.error('Failed to log system option audit:', error);
  }
};

/**
 * Get active option values for school portal forms.
 * GET /api/system-options
 */
export const getPublicSystemOptions = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const options = await executeQuery<SystemOption>(
      `
        SELECT id, option_type, value, sort_order, is_active, created_at, updated_at
        FROM system_options
        WHERE is_active = TRUE AND option_type = ANY($1)
        ORDER BY option_type, sort_order, value
      `,
      [optionTypes]
    );

    const grouped = groupOptions(options);

    res.status(200).json({
      success: true,
      data: {
        classes: grouped.classes.map((option) => option.value),
        sections: grouped.sections.map((option) => option.value),
      },
    });
  } catch (error) {
    console.error('Get public system options error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch system options',
      },
    });
  }
};

/**
 * Get all option records for admin management.
 * GET /api/admin/system-options
 */
export const getAdminSystemOptions = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const options = await executeQuery<SystemOption>(
      `
        SELECT id, option_type, value, sort_order, is_active, created_at, updated_at
        FROM system_options
        WHERE option_type = ANY($1)
        ORDER BY option_type, sort_order, value
      `,
      [optionTypes]
    );

    res.status(200).json({
      success: true,
      data: groupOptions(options),
    });
  } catch (error) {
    console.error('Get admin system options error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch system options',
      },
    });
  }
};

/**
 * Create a system option.
 * POST /api/admin/system-options
 */
export const createSystemOption = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = createSystemOptionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid system option data',
          details: validation.error.errors,
        },
      });
      return;
    }

    const data = validation.data;
    const nextOrder = await executeQueryOne<{ sort_order: number }>(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS sort_order FROM system_options WHERE option_type = $1',
      [data.option_type]
    );

    const option = await executeQueryOne<SystemOption>(
      `
        INSERT INTO system_options (option_type, value, sort_order)
        VALUES ($1, $2, $3)
        RETURNING id, option_type, value, sort_order, is_active, created_at, updated_at
      `,
      [data.option_type, data.value, data.sort_order ?? nextOrder?.sort_order ?? 1]
    );

    await logOptionChange(req, 'CREATE', option || data);

    res.status(201).json({
      success: true,
      data: option,
      message: 'System option created successfully',
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_OPTION',
          message: 'This option already exists',
        },
      });
      return;
    }

    console.error('Create system option error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create system option',
      },
    });
  }
};

/**
 * Update a system option.
 * PUT /api/admin/system-options/:optionId
 */
export const updateSystemOption = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { optionId } = req.params;

    const validation = updateSystemOptionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid system option data',
          details: validation.error.errors,
        },
      });
      return;
    }

    const existing = await executeQueryOne<SystemOption>(
      'SELECT * FROM system_options WHERE id = $1',
      [optionId]
    );

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'OPTION_NOT_FOUND',
          message: 'System option not found',
        },
      });
      return;
    }

    const updates = validation.data;
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATE_DATA',
          message: 'No data provided for update',
        },
      });
      return;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(optionId);

    const updated = await executeQueryOne<SystemOption>(
      `
        UPDATE system_options
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, option_type, value, sort_order, is_active, created_at, updated_at
      `,
      values
    );

    await logOptionChange(req, 'UPDATE', updated || updates, existing);

    res.status(200).json({
      success: true,
      data: updated,
      message: 'System option updated successfully',
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_OPTION',
          message: 'This option already exists',
        },
      });
      return;
    }

    console.error('Update system option error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update system option',
      },
    });
  }
};

/**
 * Delete a system option.
 * DELETE /api/admin/system-options/:optionId
 */
export const deleteSystemOption = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { optionId } = req.params;

    const existing = await executeQueryOne<SystemOption>(
      'SELECT * FROM system_options WHERE id = $1',
      [optionId]
    );

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'OPTION_NOT_FOUND',
          message: 'System option not found',
        },
      });
      return;
    }

    await executeQuery('DELETE FROM system_options WHERE id = $1', [optionId]);
    await logOptionChange(req, 'DELETE', existing, existing);

    res.status(200).json({
      success: true,
      message: 'System option deleted successfully',
    });
  } catch (error) {
    console.error('Delete system option error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete system option',
      },
    });
  }
};
