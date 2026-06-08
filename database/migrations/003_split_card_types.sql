ALTER TABLE cards
  MODIFY COLUMN type ENUM('my_app', 'external_link', 'doc', 'tutorial', 'inspiration', 'case_study') NOT NULL;

ALTER TABLE card_open_events
  MODIFY COLUMN card_type ENUM('my_app', 'external_link', 'doc', 'tutorial', 'inspiration', 'case_study') NOT NULL;
