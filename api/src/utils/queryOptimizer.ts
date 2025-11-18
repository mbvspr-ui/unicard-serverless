// Query optimization utilities

// Build optimized WHERE clause with proper indexing
export function buildWhereClause(filters: Record<string, any>): { clause: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

// Build pagination clause
export function buildPaginationClause(page: number = 1, limit: number = 50): { clause: string; offset: number } {
  const offset = (page - 1) * limit;
  return {
    clause: `LIMIT ${limit} OFFSET ${offset}`,
    offset,
  };
}

// Build search clause with ILIKE for case-insensitive search
export function buildSearchClause(
  searchTerm: string,
  fields: string[]
): { clause: string; value: string } {
  if (!searchTerm || fields.length === 0) {
    return { clause: '', value: '' };
  }

  const searchValue = `%${searchTerm}%`;
  const conditions = fields.map((field) => `${field} ILIKE $1`).join(' OR ');

  return {
    clause: `AND (${conditions})`,
    value: searchValue,
  };
}

// Optimize query with proper indexes
export const RECOMMENDED_INDEXES = {
  schools: [
    'CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email)',
    'CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status)',
    'CREATE INDEX IF NOT EXISTS idx_schools_created_at ON schools(created_at DESC)',
  ],
  students: [
    'CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id)',
    'CREATE INDEX IF NOT EXISTS idx_students_class ON students(class)',
    'CREATE INDEX IF NOT EXISTS idx_students_section ON students(section)',
    'CREATE INDEX IF NOT EXISTS idx_students_name ON students(name)',
    'CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC)',
  ],
  batch_submissions: [
    'CREATE INDEX IF NOT EXISTS idx_batch_submissions_school_id ON batch_submissions(school_id)',
    'CREATE INDEX IF NOT EXISTS idx_batch_submissions_status ON batch_submissions(status)',
    'CREATE INDEX IF NOT EXISTS idx_batch_submissions_submitted_at ON batch_submissions(submitted_at DESC)',
  ],
  submission_students: [
    'CREATE INDEX IF NOT EXISTS idx_submission_students_submission_id ON submission_students(submission_id)',
    'CREATE INDEX IF NOT EXISTS idx_submission_students_student_id ON submission_students(student_id)',
  ],
};

// Query performance monitoring
export class QueryMonitor {
  private static queries: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  static track(queryName: string, executionTime: number): void {
    const existing = this.queries.get(queryName) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;

    this.queries.set(queryName, existing);
  }

  static getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [queryName, data] of this.queries.entries()) {
      stats[queryName] = {
        count: data.count,
        avgTime: Math.round(data.avgTime),
        totalTime: Math.round(data.totalTime),
      };
    }

    return stats;
  }

  static getSlowestQueries(limit: number = 10): Array<{ query: string; avgTime: number }> {
    return Array.from(this.queries.entries())
      .map(([query, data]) => ({ query, avgTime: data.avgTime }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  static reset(): void {
    this.queries.clear();
  }
}

// Batch query helper to reduce N+1 queries
export async function batchQuery<T>(
  ids: string[],
  queryFn: (ids: string[]) => Promise<T[]>,
  batchSize: number = 100
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await queryFn(batch);
    results.push(...batchResults);
  }

  return results;
}
