ALTER TABLE cards
  CHANGE COLUMN is_hidden is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE AFTER is_archived,
  ADD COLUMN source_domain VARCHAR(255) NOT NULL DEFAULT '' AFTER preview_url;

ALTER TABLE cards
  DROP INDEX idx_cards_hidden_sort,
  ADD INDEX idx_cards_archived_sort (is_archived, sort_order),
  ADD INDEX idx_cards_favorite (is_favorite);

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
