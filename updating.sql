USE LostWord;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
select * from friend;
CREATE TABLE Rarity (
    rarity_code VARCHAR(20) PRIMARY KEY,
    rarity_name VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
select * from Rarity;
update Rarity set rarity_name = 'Pure Festival' where rarity_code = 'PURE';
INSERT INTO Rarity VALUES
('GENERAL','General'),
('FES','Festival'),
('UFES','Ultra Festival'),
('RFES','Relic Festival'),
('GENIC','Genic'),
('EPIC','Epic'),
('EXFes','EX Festival'),
('YUKKURI','Yukkuri'),
('PURE','PURE Festival');
SET SQL_SAFE_UPDATES = 1;
DELETE FROM Friend WHERE universe IN ('L1', 'B3');
select * from friend where universe = "Cs2#";
CREATE TABLE Friend (
    friend_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rarity_code VARCHAR(20) NOT NULL,
    universe VARCHAR(20) NOT NULL,
    role ENUM(
        'Attack','Support','Heal','Defense',
        'Technical','Debuff','Speed','Destroy'
    ) NOT NULL,
    image_url VARCHAR(255),
    CONSusersusersTRAINT fk_friend_rarity
        FOREIGN KEY (rarity_code) REFERENCES Rarity(rarity_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
select * from friend;
UPDATE Friend
SET image_url = REPLACE(image_url, ' ', '_')
WHERE friend_id > 0;

delete from friend where friend_id >208;
INSERT INTO Friend (name, rarity_code, universe, role, image_url) VALUES
('Reimu Hakurei','GENERAL','L1','Defense','/image/friend/Reimu_L1.png'),
('Marisa Kirisame','GENERAL','L1','Attack','/image/friend/Marisa_L1.png'),
('Sakuya Izayoi','GENERAL','L1','Speed','/image/friend/Sakuya_L1.png'),
('Sanae Kochiya','GENERAL','L1','Heal','/image/friend/Sanae_L1.webp'),
('Patchouli Knowledge','GENERAL','L1','Technical','/image/friend/Patchouli_L1.png'),
('Hong Meiling','GENERAL','L1','Attack','/image/friend/Meiling_L1.png'),
('Youmu Konpaku','GENERAL','L1','Attack','/image/friend/Youmu_L1.png'),
('Reisen Udonge Inaba','GENERAL','L1','Debuff','/image/friend/Reisen_L1.png'),
('Lily White','GENERAL','L1','Heal','/image/friend/Lily_L1.png'),
('Ran Yakumo','GENERAL','L1','Attack','/image/friend/Ran_L1.png'),
('Chen','GENERAL','L1','Speed','/image/friend/Chen_L1.png'),
('Alice Margatroid','GENERAL','L1','Technical','/image/friend/Alice_L1.png'),
('Daiyousei','GENERAL','L1','Support','/image/friend/Daiyousei_L1.png'),
('Star Sapphire','GENERAL','L1','Debuff','/image/friend/Star_L1.png'),
('Sunny Milk','GENERAL','L1','Attack','/image/friend/Sunny_L1.png'),
('Luna Child','GENERAL','L1','Technical','/image/friend/Luna_L1.png'),
('Cirno','GENERAL','L1','Destroy','/image/friend/Cirno_L1.png'),
('Medicinde Melancholy','GENERAL','L1','Technical','/image/friend/Medicine_L1.png'),
('Nitori Kawashiro','GENERAL','L1','Debuff','/image/friend/Nitori_L1.png'),
('Yuyuko Saigyouji','GENERAL','L1','Attack','/image/friend/Yuyuko_L1.png');

CREATE TABLE FriendStat (
    friend_id INT PRIMARY KEY,
    hp INT NOT NULL,
    yin_atk INT NOT NULL,
    yang_atk INT NOT NULL,
    yin_def INT NOT NULL,
    yang_def INT NOT NULL,
    agility INT NOT NULL,
    FOREIGN KEY (friend_id) REFERENCES Friend(friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE FriendSkill (
    friendSkill_id INT AUTO_INCREMENT PRIMARY KEY,
    friend_id INT NOT NULL,
    skill_index TINYINT,
    name VARCHAR(100),
    effect VARCHAR(500),
    turn_duration INT,
    type_skill ENUM('ATK Skill','SUPP skill','DEF skill'),
    image_url VARCHAR(255),
    UNIQUE (friend_id, skill_index),
    FOREIGN KEY (friend_id) REFERENCES Friend(friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE FriendPassive (
    friendPassive_id INT AUTO_INCREMENT PRIMARY KEY,
    friend_id INT NOT NULL,
    passive_index TINYINT,
    name VARCHAR(100),
    effect VARCHAR(500),
    image_url VARCHAR(255),
    UNIQUE (friend_id, passive_index),
    FOREIGN KEY (friend_id) REFERENCES Friend(friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE FriendAbility (
    friend_id INT PRIMARY KEY,
    ability VARCHAR(500),
    switch_effect VARCHAR(300),
    FOREIGN KEY (friend_id) REFERENCES Friend(friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE FriendTemperament (
    friend_id INT PRIMARY KEY,
    description VARCHAR(2000),
    FOREIGN KEY (friend_id) REFERENCES Friend(friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Element (
    element_code CHAR(2) PRIMARY KEY,
    element_name VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO Element VALUES
('MO','Moon'),
('SU','Sun'),
('WA','Water'),
('WO','Wood'),
('ME','Metal'),
('ST','Star'),
('FI','Fire'),
('EA','Earth');

CREATE TABLE FriendElementAffinity (
    friend_id INT,
    element_code CHAR(2),
    affinity_type ENUM('WEAK','RES'),
    PRIMARY KEY (friend_id, element_code),
    FOREIGN KEY (friend_id) REFERENCES Friend(friend_id),
    FOREIGN KEY (element_code) REFERENCES Element(element_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE LimitBreakItem (
    item_code VARCHAR(20) PRIMARY KEY,
    item_name VARCHAR(50),
    image_url VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO LimitBreakItem VALUES
('JUMBO','Jumbo Doll','image/paperdoll/JumboDoll.png'),
('DUPE','Dupe',null),
('DIVINE','Divine Doll','image/paperdoll/DivineDoll.png'),
('RELIC','Relic Doll','image/paperdoll/RelicDoll.png'),
('EPIC','Eoic Doll','image/paperdoll/EpicDoll.png'),
('DOLL','Paper Doll','image/paperdoll/PaperDoll.png');

CREATE TABLE RarityLimitBreak (
    rarity_code VARCHAR(20) PRIMARY KEY,
    item_code VARCHAR(20) NOT NULL,
    FOREIGN KEY (rarity_code) REFERENCES Rarity(rarity_code),
    FOREIGN KEY (item_code) REFERENCES LimitBreakItem(item_code)
);
INSERT INTO RarityLimitBreak VALUES
('GENERAL','DOLL'),
('FES','DOLL'),
('UFES','DIVINE'),
('RFES','RELIC'),
('GENIC','RELIC'),
('EPIC','EPIC'),
('EXFES','JUMBO'),
('YUKKURI','DUPE');
select * from RarityLimitBreak;

CREATE TABLE StoryCard (
    storycard_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    rarity int,
    type VARCHAR(30),
    image_url VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

select * from storycard
CREATE TABLE StoryCardInfo (
    info_id INT AUTO_INCREMENT PRIMARY KEY,
    storycard_id INT NOT NULL,
    info_index TINYINT,
    description VARCHAR(1000),
    UNIQUE (storycard_id, info_index),
    FOREIGN KEY (storycard_id) REFERENCES StoryCard(storycard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Effect (
    effect_code VARCHAR(50) PRIMARY KEY,
    effect_name VARCHAR(100),
    effect_group VARCHAR(50),
    icon_up_url VARCHAR(255),
    icon_down_url VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

select * from Effect;
select * from StoryCardEffect;
INSERT INTO Effect VALUES
('YANG_DEF','Yang DEF','Status Buff','/image/effect/YangDefUp.webp','/image/effect/YangDefDown.webp'),
('YING_DEF','Yin DEF','Status Buff','/image/effect/YinDefUp.webp','/image/effect/YinDefDown.webp'),
('YANG_ATK','Yang ATK','Status Buff','/image/effect/YangAtkUp.webp','/image/effect/YangAtkDown.webp'),
('YING_ATK','Yin ATK','Status Buff','/image/effect/YinAtkUp.webp','/image/effect/YinAtkDown.webp'),
('CRIT_ATK','Crit ATK','Status Buff','/image/effect/CritAtkUp.webp','/image/effect/CritAtkDown.webp'),
('CRIT_ACC','Crit ACC','Status Buff','/image/effect/CritAccUp.webp',NULL),
('CRIT_DEF','Crit DEF','Status Buff','/image/effect/CritDefUp.webp','/image/effect/CritDefDown.webp'),
('ACC','Accuracy','Status Buff','/image/effect/AccuracyUp.webp','/image/effect/AccuracyDown.webp'),
('AGI','Agility','Status Buff','/image/effect/AgilityUp.webp','/image/effect/AgilityDown.webp'),
('CRIT_EVA','Crit Evasion','Status Buff','/image/effect/CritEvaUp.webp','/image/effect/CritEvaDown.webp'),
('EVA','Evasion','Status Buff','/image/effect/EvasionUp.webp','/image/effect/EvasionDown.webp'),
('FOCUS','Focus','Status Buff','/image/effect/FocusUp.webp','/image/effect/FocusDown.webp');
INSERT INTO Effect VALUES
('SUN','Sun','Elemental Modifier','/image/element/SunUp.webp','/image/protection/SunProtection.webp'),
('EARTH','Earth','Elemental Modifier','/image/element/EarthUp.webp','/image/protection/EarthProtection.webp'),
('FIRE','Fire','Elemental Modifier','/image/element/FireUp.webp','/image/protection/FireProtection.webp'),
('WATER','Water','Elemental Modifier','/image/element/WaterUp.webp','/image/protection/WaterProtection.webp'),
('WOOD','Wood','Elemental Modifier','/image/element/WoodUp.webp','/image/protection/WoodProtection.webp'),
('METAL','Metal','Elemental Modifier','/image/element/MetalUp.webp','/image/protection/MetalProtection.webp'),
('MOON','Moon','Elemental Modifier','/image/element/MoonUp.webp','/image/protection/MoonProtection.webp'),
('STAR','Star','Elemental Modifier','/image/element/StarUp.webp','/image/protection/StarProtection.webp'),
('NO','No Element','Elemental Modifier','/image/element/NoUp.webp',NULL);
INSERT INTO Effect VALUES
('BODY','Body','Bullet Modifier','/image/bullet/BodyBulletUp.webp','/image/protection/BulletProtection.webp'),
('ENERGY','Energy','Bullet Modifier','/image/bullet/EnergyBulletUp.webp','/image/protection/BulletProtection.webp'),
('HEAVY','Heavy','Bullet Modifier','/image/bullet/HeavyBulletUp.webp','/image/protection/BulletProtection.webp'),
('LASER','Laser','Bullet Modifier','/image/bullet/LaserBulletUp.webp','/image/protection/BulletProtection.webp'),
('LIGHT','Light','Bullet Modifier','/image/bullet/LightBulletUp.webp','/image/protection/BulletProtection.webp'),
('LIQUID','Liquid','Bullet Modifier','/image/bullet/LiquidBulletUp.webp','/image/protection/BulletProtection.webp'),
('MISSILE','Missile','Bullet Modifier','/image/bullet/MissileBulletUp.webp','/image/protection/BulletProtection.webp'),
('NORMAL','Normal','Bullet Modifier','/image/bullet/NormalBulletUp.webp','/image/protection/BulletProtection.webp'),
('OFUDA','Ofuda','Bullet Modifier','/image/bullet/OfudaBulletUp.webp','/image/protection/BulletProtection.webp'),
('SHARP','Sharp','Bullet Modifier','/image/bullet/SharpBulletUp.webp','/image/protection/BulletProtection.webp'),
('SLASH','Slash','Bullet Modifier','/image/bullet/SlashBulletUp.webp','/image/protection/BulletProtection.webp');
INSERT INTO Effect VALUES
('HP_RECOVERY','HP Recovery','General Status', '/image/effect/Heal.webp',null),
('BARRIER_RECOVERY','Barrier Recovery','General Status', '/image/effect/BarrierRestore.webp',null),
('BARRIER_STATUS_HEAL','Barrier Status Heal','General Status', '/image/effect/BarrierStatusHeal.webp',null),
('SPIRIT_POWER_UP','Spirit power up','General Status', '/image/effect/PowerScale.png',null),
('SPIRIT_POWER_RATE_UP','Spirit Power rate up','General Status', '/image/effect/PowerScale.png',null);
select * from friend;
UPDATE Friend 
SET universe = REPLACE(universe, '___', ':') 
WHERE universe LIKE '%___%';

select * from effect;
CREATE TABLE StoryCardEffect (
    storycard_effect_id INT AUTO_INCREMENT PRIMARY KEY,
    storycard_id INT NOT NULL,
    effect_code VARCHAR(50) NOT NULL,
    direction ENUM('UP','DOWN'),
    value INT,
    target ENUM('SELF','TARGET','PARTY','ENEMY'),
    duration INT,
    FOREIGN KEY (storycard_id) REFERENCES StoryCard(storycard_id),
    FOREIGN KEY (effect_code) REFERENCES Effect(effect_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE StoryCardEffect MODIFY COLUMN value FLOAT;
ALTER TABLE StoryCardLuckEffect MODIFY COLUMN value FLOAT;
CREATE TABLE StoryCardStat (
    storycard_id INT PRIMARY KEY,
    hp INT,
    yin_atk INT,
    yang_atk INT,
    yin_def INT,
    yang_def INT,
    agility INT,
    FOREIGN KEY (storycard_id) REFERENCES StoryCard(storycard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


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

select * from storycard;
SET SQL_SAFE_UPDATES = 0;

-- Lệnh này sẽ tìm tất cả các chữ ".png" trong cột image_url và xóa nó đi
UPDATE StoryCard 
SET image_url = REPLACE(image_url, '.png', '') 
WHERE image_url LIKE '%.png%';

select * from effect;
UPDATE effect 
SET icon_up_url = REPLACE(icon_up_url, '.png', '') 
WHERE icon_up_url LIKE '%.png%';

SET SQL_SAFE_UPDATES = 1;

ALTER TABLE storycard ADD COLUMN sort_order INT DEFAULT 999;

-- 1. Thêm cột cho hệ thống Tag và Nhóm Luck
ALTER TABLE StoryCardEffect ADD COLUMN tag VARCHAR(100) DEFAULT NULL;
ALTER TABLE StoryCardEffect ADD COLUMN luck_group INT DEFAULT 0;

-- 2. Thêm cột cho hệ thống Stat EX (Ngẫu nhiên)
select * from storycardstat;
select * from StoryCardExStat;
select * from storycardeffect;
select * from storycard;
ALTER TABLE StoryCardEffect DROP COLUMN luck_group;
ALTER TABLE StoryCardStat 
DROP COLUMN is_random, DROP COLUMN random_min, DROP COLUMN random_max;
CREATE TABLE StoryCardExStat (
    storycard_id INT PRIMARY KEY,
    stat1_type VARCHAR(20),
    stat1_min INT,
    stat1_max INT,
    stat2_type VARCHAR(20),
    stat2_min INT,
    stat2_max INT,
    FOREIGN KEY (storycard_id) REFERENCES StoryCard(storycard_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE StoryCardLuckEffect (
    luck_effect_id INT AUTO_INCREMENT PRIMARY KEY,
    storycard_id INT,
    luck_group INT,
    effect_code VARCHAR(50),
    direction VARCHAR(10),
    value INT,
    target VARCHAR(20),
    duration INT,
    role_lock VARCHAR(20) DEFAULT 'ALL',
    tag VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (storycard_id) REFERENCES StoryCard(storycard_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Bổ sung 2 Effect mới vào Từ điển Effect
select * from effect where effect_code = 'TAG_RESIST';
UPDATE effect 
SET icon_down_url = null
WHERE effect_code = 'TAG_RESIST';

UPDATE effect 
SET icon_up_url = '/image/protection/UnitTagProtection'
WHERE effect_code = 'TAG_RESIST';

UPDATE storycard SET image_url = REPLACE(image_url, '?', '') WHERE image_url LIKE '%?%';

UPDATE Friend 
SET universe = REPLACE(universe, ':', '.') 
WHERE universe LIKE '%:%';
INSERT INTO Effect VALUES 
('TAG_RESIST', 'Damage Resist (Tag)', 'Tag Modifier', NULL,'/image/protection/UnitTagProtection.webp');

Select * from friend where name ="Marisa Kirisame"
SET SQL_SAFE_UPDATES = 0;
