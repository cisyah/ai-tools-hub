CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  type ENUM('my_app', 'external_link', 'doc', 'tutorial', 'inspiration', 'case_study') NOT NULL,
  icon VARCHAR(80) NOT NULL DEFAULT '',
  preview_url MEDIUMTEXT NULL,
  source_domain VARCHAR(255) NOT NULL DEFAULT '',
  tags JSON NOT NULL,
  notes TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_cards_archived_sort (is_archived, sort_order),
  INDEX idx_cards_favorite (is_favorite),
  INDEX idx_cards_type (type)
);

CREATE TABLE IF NOT EXISTS lists (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  kind ENUM('manual', 'smart') NOT NULL,
  filters JSON NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_lists_kind_sort (kind, sort_order)
);

CREATE TABLE IF NOT EXISTS card_lists (
  list_id VARCHAR(36) NOT NULL,
  card_id VARCHAR(36) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (list_id, card_id),
  INDEX idx_card_lists_card (card_id),
  CONSTRAINT fk_card_lists_list FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_card_lists_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS card_open_events (
  id VARCHAR(36) PRIMARY KEY,
  card_id VARCHAR(36) NOT NULL,
  card_type ENUM('my_app', 'external_link', 'doc', 'tutorial', 'inspiration', 'case_study') NOT NULL,
  event_day DATE NOT NULL,
  search_query VARCHAR(255) NOT NULL DEFAULT '',
  filter_type VARCHAR(32) NOT NULL DEFAULT '',
  filter_tags JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_open_events_day (event_day),
  INDEX idx_open_events_card (card_id),
  CONSTRAINT fk_open_events_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
