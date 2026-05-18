-- Add configurable system options for classes, sections, and future option groups.

CREATE TABLE IF NOT EXISTS system_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_type VARCHAR(50) NOT NULL,
  value VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (option_type, value)
);

CREATE INDEX IF NOT EXISTS idx_system_options_type ON system_options(option_type);
CREATE INDEX IF NOT EXISTS idx_system_options_active ON system_options(is_active);
CREATE INDEX IF NOT EXISTS idx_system_options_sort ON system_options(option_type, sort_order, value);

INSERT INTO system_options (option_type, value, sort_order)
VALUES
  ('class', 'Nursery', 1),
  ('class', 'KG', 2),
  ('class', 'KG1', 3),
  ('class', 'KG2', 4),
  ('class', 'LKG', 5),
  ('class', 'UKG', 6),
  ('class', 'Class 1', 7),
  ('class', 'Class 2', 8),
  ('class', 'Class 3', 9),
  ('class', 'Class 4', 10),
  ('class', 'Class 5', 11),
  ('class', 'Class 6', 12),
  ('class', 'Class 7', 13),
  ('class', 'Class 8', 14),
  ('class', 'Class 9', 15),
  ('class', 'Class 10', 16),
  ('class', 'Class 11', 17),
  ('class', 'Class 12', 18),
  ('section', 'A', 1),
  ('section', 'B', 2),
  ('section', 'C', 3),
  ('section', 'D', 4),
  ('section', 'E', 5),
  ('section', 'F', 6)
ON CONFLICT (option_type, value) DO NOTHING;
