ALTER TABLE categories ADD COLUMN parent_id BIGINT;
ALTER TABLE categories ADD COLUMN description VARCHAR(1000) NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE categories ADD CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id);
CREATE INDEX idx_category_parent ON categories(parent_id);
ALTER TABLE products ADD COLUMN image MEDIUMTEXT;
ALTER TABLE products ADD COLUMN barcode VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN description VARCHAR(2000) NOT NULL DEFAULT '';
