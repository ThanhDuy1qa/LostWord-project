

select * from friend where universe ="L1"
select * from friend where name ="Marisa Kirisame"

-- Tắt chế độ bảo vệ an toàn
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE friendstat;
TRUNCATE TABLE Friend;
SET FOREIGN_KEY_CHECKS = 1;
-- 1. Đổi 3 dấu gạch dưới thành dấu hai chấm (:)
UPDATE Friend SET universe = REPLACE(universe, '___', ':') WHERE universe LIKE '%___%';

-- 2. Đổi 2 dấu gạch dưới thành dấu lớn hơn (>)
UPDATE Friend SET universe = REPLACE(universe, '__', '>') WHERE universe LIKE '%__%';

-- 3. Đổi 1 dấu gạch dưới thành dấu nhỏ hơn (<)
UPDATE Friend SET universe = REPLACE(universe, '_', '<') WHERE universe LIKE '%_%';

SET SQL_SAFE_UPDATES = 0;
UPDATE Friend SET name = REPLACE(name, '<', ' ') WHERE name LIKE '%<%';
SET SQL_SAFE_UPDATES = 1;
ALTER TABLE Friend ADD COLUMN sort_order INT DEFAULT 999;