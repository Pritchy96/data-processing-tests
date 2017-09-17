use new_data;

CREATE TABLE nodes (
  node_ID INT(11) NOT NULL AUTO_INCREMENT,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletion_date TIMESTAMP NULL,
  PRIMARY KEY (node_ID)
);

CREATE TABLE tag_types (
  tag_type_ID int(11)   NOT NULL AUTO_INCREMENT,
  name        CHAR(100) NOT NULL,
  tag_table_type   CHAR(100) NOT NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tag_type_ID)
);

CREATE TABLE tag_table_types (
  name        CHAR(100) NOT NULL,
  PRIMARY KEY (name)
);

CREATE TABLE tags (
  tag_ID INT(11)    NOT NULL AUTO_INCREMENT,
  tag_type_ID INT(11) NOT NULL,
  node_ID INT(11)   NOT NULL,
  `key` CHAR(100)   NOT NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletion_date TIMESTAMP NULL,
  PRIMARY KEY (tag_ID, tag_type_ID),
  FOREIGN KEY (node_ID) REFERENCES nodes(node_ID),
  FOREIGN KEY (tag_type_ID) REFERENCES tag_types(tag_type_ID)
);

CREATE TABLE tags_string (
  tag_ID INT(11),
  `value` CHAR(100) NOT NULL,
  FOREIGN KEY(tag_ID) REFERENCES tags(tag_ID)
);

CREATE TABLE tags_integer (
  tag_ID INT(11),
  `value` INT(11) NOT NULL,
  FOREIGN KEY(tag_ID) REFERENCES tags(tag_ID)
);

CREATE TABLE tags_float (
  tag_ID INT(11),
  `value` FLOAT NOT NULL,
  FOREIGN KEY(tag_ID) REFERENCES tags(tag_ID)
);

CREATE TABLE tags_timestamp (
  tag_ID INT(11),
  `value`TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (tag_ID) REFERENCES tags(tag_ID)
);

CREATE TABLE tags_filepointer (
  tag_ID INT(11),
  `value` CHAR(100) NOT NULL,
  FOREIGN KEY(tag_ID) REFERENCES tags(tag_ID)
);

INSERT INTO tag_table_types VALUES ("tags_string"), ("tags_integer"), ("tags_float"), ("tags_timestamp"), ("tags_filepointer");

CREATE TABLE apps (
  app_ID INT(11)  NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (app_ID)
);

 #Example data
INSERT INTO nodes VALUES(),(),(),(),(); #Add five nodes.
INSERT INTO tag_types (name, tag_table_type) VALUES ("temperature", "tags_float");
INSERT INTO tag_types (name, tag_table_type) VALUES ("name", "tags_string");

#UNIQUE KEY unique_tags (node_ID, `key`, `value`), #Ensures any given node doesnt have duplicate tags.
