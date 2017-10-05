#use snake_case for SQL stuff:
#https://smyck.net/2011/06/21/camel-case-in-mysql-table-names-is-a-bad-idea/

use new_data;

CREATE TABLE nodes (
  node_id INT(11) NOT NULL AUTO_INCREMENT,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletion_date TIMESTAMP NULL,
  PRIMARY KEY (node_id)
);

CREATE TABLE tag_types (
  tag_type_id int(11)   NOT NULL AUTO_INCREMENT,
  name        CHAR(100) NOT NULL,
  tag_table_type   CHAR(100) NOT NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tag_type_id)
);

CREATE TABLE tag_table_types (
  name        CHAR(100) NOT NULL,
  PRIMARY KEY (name)
);

CREATE TABLE tags (
  tag_id INT(11)    NOT NULL AUTO_INCREMENT,
  tag_type_id INT(11) NOT NULL,
  node_id INT(11)   NOT NULL,
  `key` CHAR(100)   NOT NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletion_date TIMESTAMP NULL,
  PRIMARY KEY (tag_id, tag_type_id),
  FOREIGN KEY (node_id) REFERENCES nodes(node_id),
  FOREIGN KEY (tag_type_id) REFERENCES tag_types(tag_type_id)
);

CREATE TABLE tags_string (
  tag_id INT(11),
  `value` CHAR(100) NOT NULL,
  FOREIGN KEY(tag_id) REFERENCES tags(tag_id)
);

CREATE TABLE tags_integer (
  tag_id INT(11),
  `value` INT(11) NOT NULL,
  FOREIGN KEY(tag_id) REFERENCES tags(tag_id)
);

CREATE TABLE tags_float (
  tag_id INT(11),
  `value` FLOAT NOT NULL,
  FOREIGN KEY(tag_id) REFERENCES tags(tag_id)
);

CREATE TABLE tags_timestamp (
  tag_id INT(11),
  `value`TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
);

CREATE TABLE tags_filepointer (
  tag_id INT(11),
  `value` CHAR(100) NOT NULL,
  FOREIGN KEY(tag_id) REFERENCES tags(tag_id)
);

INSERT INTO tag_table_types VALUES ("tags_string"), ("tags_integer"), ("tags_float"), ("tags_timestamp"), ("tags_filepointer");

CREATE TABLE apps (
  app_id INT(11)  NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (app_id)
);

 #Example data
INSERT INTO nodes VALUES(),(),(),(),(); #Add five nodes.
INSERT INTO tag_types (name, tag_table_type) VALUES ("temperature", "tags_float");
INSERT INTO tag_types (name, tag_table_type) VALUES ("name", "tags_string");

#UNIQUE KEY unique_tags (node_id, `key`, `value`), #Ensures any given node doesnt have duplicate tags.
