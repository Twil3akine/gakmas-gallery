ALTER TABLE idols ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE idols SET sort_order = 1  WHERE name = '花海咲季';
UPDATE idols SET sort_order = 2  WHERE name = '月村手毬';
UPDATE idols SET sort_order = 3  WHERE name = '藤田ことね';
UPDATE idols SET sort_order = 4  WHERE name = '雨夜燕';
UPDATE idols SET sort_order = 5  WHERE name = '有村麻央';
UPDATE idols SET sort_order = 6  WHERE name = '葛城リーリヤ';
UPDATE idols SET sort_order = 7  WHERE name = '倉本千奈';
UPDATE idols SET sort_order = 8  WHERE name = '紫雲清夏';
UPDATE idols SET sort_order = 9  WHERE name = '篠澤広';
UPDATE idols SET sort_order = 10 WHERE name = '十王星南';
UPDATE idols SET sort_order = 11 WHERE name = '秦谷美鈴';
UPDATE idols SET sort_order = 12 WHERE name = '花海佑芽';
UPDATE idols SET sort_order = 13 WHERE name = '姫崎莉波';
