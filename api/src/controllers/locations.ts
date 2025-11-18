import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load locations data
const locationsData = JSON.parse(
  readFileSync(join(__dirname, '../data/india-locations.json'), 'utf-8')
);

// Cache for location data
let cachedStates: string[] | null = null;
let cachedDistricts: Record<string, string[]> | null = null;

/**
 * Get all Indian states
 */
export const getStates = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use cached data if available
    if (!cachedStates) {
      cachedStates = locationsData.states;
    }

    res.json({
      success: true,
      data: cachedStates,
    });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch states',
      },
    });
  }
};

/**
 * Get districts for a specific state
 */
export const getDistricts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { state } = req.params;

    if (!state) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'State parameter is required',
        },
      });
      return;
    }

    // Use cached data if available
    if (!cachedDistricts) {
      cachedDistricts = locationsData.districts;
    }

    const districts = cachedDistricts[state];

    if (!districts) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STATE_NOT_FOUND',
          message: `No districts found for state: ${state}`,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: districts,
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch districts',
      },
    });
  }
};
