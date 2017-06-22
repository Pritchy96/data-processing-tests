use data;

CREATE TABLE nodes (
  node_ID INT(11) NOT NULL AUTO_INCREMENT,
  version INT(11),
  file_pointer CHAR(255) NOT NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  delete_date   TIMESTAMP NULL,
  PRIMARY KEY (node_ID)
);

CREATE TABLE tags (
  tag_ID INT(11) NOT NULL AUTO_INCREMENT,
  node_ID INT(11) NOT NULL,
  `key` CHAR(100) NOT NULL,
  `value` CHAR(100) NOT NULL,
  UNIQUE KEY unique_tags (node_ID, `key`, `value`), #Ensures any given node doesn't have duplicate tags.
  PRIMARY KEY (tag_ID),
  FOREIGN KEY (node_ID) REFERENCES nodes(node_ID)
);
