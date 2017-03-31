CREATE TABLE items (
  item_ID INT(11) NOT NULL AUTO_INCREMENT,
  version INT(11),
  file_pointer CHAR(255) NOT NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (item_ID)
);

CREATE TABLE tags (
  tag_ID INT(11) NOT NULL AUTO_INCREMENT,
  item_ID INT(11) NOT NULL,
  `key` CHAR(100) NOT NULL,
  `value` CHAR(100) NOT NULL,
  UNIQUE KEY unique_tags (item_ID, `value`), --Ensures any given item doesn't have duplicate tags.
  PRIMARY KEY (tag_ID),
  FOREIGN KEY (item_ID) REFERENCES items(item_ID)
);
