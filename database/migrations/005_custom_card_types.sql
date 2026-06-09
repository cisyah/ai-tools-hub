CREATE TABLE IF NOT EXISTS card_types (
  id VARCHAR(64) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_card_types_label (label)
);

INSERT INTO card_types (id, label, sort_order) VALUES
  ('my_app', '我的应用', 0),
  ('external_link', '外部链接', 10),
  ('doc', '文档', 20),
  ('tutorial', '教程', 30),
  ('inspiration', '灵感', 40),
  ('case_study', '案例', 50)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  sort_order = VALUES(sort_order);

ALTER TABLE cards
  MODIFY COLUMN type VARCHAR(64) NOT NULL;

ALTER TABLE card_open_events
  MODIFY COLUMN card_type VARCHAR(64) NOT NULL;
