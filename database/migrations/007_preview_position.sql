ALTER TABLE cards
  ADD COLUMN preview_position VARCHAR(32) NOT NULL DEFAULT '50% 0%' AFTER preview_url;
