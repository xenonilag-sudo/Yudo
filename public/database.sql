-- ==============================================================================
-- CƠ SỞ DỮ LIỆU CẨM NANG QUẢN LÝ & XÂY DỰNG DISCORD SERVER
-- File: database.sql
-- Mô tả: Chứa lược đồ bảng, chỉ mục và tài liệu hướng dẫn chuyên sâu về Discord Server
-- ==============================================================================

DROP TABLE IF EXISTS article_sections;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS queries_log;

-- Bảng Danh mục chuyên đề
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Bảng Bài viết hướng dẫn chuyên môn
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_title TEXT,
  reading_time INTEGER DEFAULT 5,
  tags TEXT,
  views INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Bảng Mục lục các phân mục (Table of Contents) của từng bài viết
CREATE TABLE article_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  section_anchor TEXT NOT NULL,
  section_title TEXT NOT NULL,
  section_level INTEGER DEFAULT 2,
  sort_order INTEGER NOT NULL
);

-- Bảng Lịch sử tra cứu thời gian thực
CREATE TABLE queries_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL,
  executed_at TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  duration_ms REAL DEFAULT 0.0
);

-- Các chỉ mục tối ưu hóa tìm kiếm
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_featured ON articles(is_featured);
CREATE INDEX idx_sections_article ON article_sections(article_id);

-- DỮ LIỆU DANH MỤC (CATEGORIES)
INSERT INTO categories (id, slug, name, description, icon, sort_order) VALUES
(1, 'kien-truc-kenh', 'Kiến Trúc & Bố Cục Kênh', 'Quy tắc thiết kế danh mục, đặt tên kênh, Forum, Voice Stage và phân luồng thông tin.', 'LayoutGrid', 1),
(2, 'phan-quyen-vai-tro', 'Phân Quyền & Vai Trò (Roles)', 'Thiết lập thứ tự cấp bậc vai trò, ma trận phân quyền tối thiểu và bảo mật quyền Admin.', 'ShieldCheck', 2),
(3, 'bao-mat-phong-chong-raid', 'Bảo Mật & Phòng Chống Raid', 'Hệ thống phòng thủ đa tầng, chống scam link, cấu hình AutoMod và khóa server khẩn cấp.', 'Lock', 3),
(4, 'bot-va-tu-dong-hoa', 'Hệ Sinh Thái Bot & Tự Động Hóa', 'Lựa chọn bot quản trị, bot ticket, cấu hình Webhook thông báo và embed tương tác.', 'Bot', 4),
(5, 'onboarding-va-quy-dinh', 'Onboarding & Quy Định Máy Chủ', 'Thiết lập quy trình tiếp đón thành viên tự động, mẫu nội quy chuẩn và phân vai trò tự động.', 'UserCheck', 5),
(6, 'quan-tri-mod-va-cong-dong', 'Vận Hành & Phát Triển Cộng Đồng', 'Sổ tay điều hành ban Moderator, văn hóa ứng xử, tổ chức sự kiện và tăng tương tác.', 'Users', 6);

-- DỮ LIỆU BÀI VIẾT HƯỚNG DẪN (ARTICLES)

-- Bài 1: Kiến trúc kênh chuẩn
INSERT INTO articles (
  id, category_id, slug, title, summary, content, author, author_title, reading_time, tags, views, is_featured, published_at, updated_at
) VALUES (
  1, 1, 'thiet-ke-cau-truc-kenh-va-danh-muc-chuan-discord',
  'Cẩm Nang Thiết Kế Kiến Trúc Kênh Và Danh Mục Chuẩn Cho Discord Server',
  'Nguyên tắc thiết kế hệ thống kênh văn bản, kênh thoại, phân chia danh mục logic và áp dụng ký tự quy chuẩn giúp thành viên không bị ngợp thông tin.',
  '## 1. Tầm quan trọng của kiến trúc kênh chuẩn

Một lỗi phổ biến nhất của các Server Discord mới khởi tạo là **tạo quá nhiều kênh ngay từ đầu** (Channel Bloat). Khi thành viên mới bước vào và nhìn thấy hàng chục kênh trống vắng không có tương tác, họ sẽ có xu hướng tắt thông báo hoặc rời khỏi server ngay lập tức.

Nguyên tắc vàng: **"Bắt đầu tinh gọn, mở rộng theo nhu cầu thực tế"**. Một cấu trúc kênh khoa học giúp người dùng ngay lập tức biết mình nên nhắn tin ở đâu và tìm kiếm tài liệu ở mục nào.

---

## 2. Mô hình phân nhóm danh mục 5 tầng chuẩn (Standard 5-Tier Category)

Dưới đây là sơ đồ cấu trúc danh mục đã được kiểm chứng hiệu quả cho hầu hết các server từ 50 đến 50.000 thành viên:

### Tầng 1: 📌 WELCOME & INFORMATION (Chỉ đọc)
Chỉ mở quyền xem cho thành viên, chỉ Admin/Mod có quyền gửi tin nhắn.
- `📜・quy-định`: Nội quy server rõ ràng, súc tích.
- `📢・thông-báo`: Kênh Announcement chính thức từ Ban Quản Trị.
- `🎉・sự-kiện`: Lịch trình hoạt động, minigame, giveaways.
- `🧭・bắt-đầu-tại-đây`: Hướng dẫn ngắn về cấu trúc server, các link mạng xã hội hoặc trang tài liệu.

### Tầng 2: 💬 CHAT & THẢO LUẬN CHUNG (Tương tác chính)
Trọng tâm hoạt động hàng ngày của cộng đồng.
- `💬・trò-chuyện-chung`: Nơi giao lưu tổng hợp của toàn bộ thành viên.
- `🤖・lệnh-bot`: Nơi gõ các lệnh nghe nhạc, kiểm tra level, kinh tế ảo nhằm tránh làm loãng kênh chat chính.
- `📸・hình-ảnh-media`: Chia sẻ ảnh, video, setup bàn làm việc, góc học tập.
- `💡・góp-ý-server`: Nơi lắng nghe phản hồi của thành viên để nâng cấp máy chủ.

### Tầng 3: 🎯 CHUYÊN MỤC CHUYÊN SÂU / SỞ THÍCH
Chỉ hiển thị cho những ai quan tâm thông qua tính năng Discord Onboarding hoặc Role Reaction.
- Dạng kênh Văn bản (Text) hoặc Kênh Diễn Đàn (Forum Channel).
- Ví dụ: `💻・lập-trình`, `🎨・thiết-kế`, `🎮・gaming-lounge`, `📚・chia-sẻ-tài-liệu`.

### Tầng 4: 🔊 KÊNH THOẠI & SỰ KIỆN (Voice Lounge)
- `☕・Phòng Chờ Thư Giãn` (Không giới hạn slot).
- `🎙️・Giao Lưu 1` (Giới hạn 5 - 10 người để tránh ồn ào).
- `📻・Phòng Nghe Nhạc / Học Tập` (Kênh yên tĩnh, tắt mic mặc định).
- `🎪・Sân Khấu Sự Kiện (Stage Channel)`: Dành cho tọa đàm, AMA có diễn giả và người nghe.

### Tầng 5: 🛡️ PHÒNG ĐIỀU HÀNH & NỘI BỘ (Staff Only)
Ẩn hoàn toàn với người thường bằng cách chặn quyền View Channel của vai trò `@everyone`.
- `🚨・mod-chat`: Trao đổi nội bộ giữa Mod, Admin và Helper.
- `📋・bot-logs`: Kênh nhận cảnh báo từ AutoMod, Carl-bot, Wick.
- `🎟️・ticket-support`: Khu vực xử lý các ticket khiếu nại của thành viên.

---

## 3. Quy tắc đặt tên kênh trực quan và đồng bộ

Đặt tên kênh nhất quán giúp giao diện server sang trọng, dễ đọc trên cả máy tính và điện thoại di động:

- **Sử dụng ký tự phân tách đồng nhất:** Hãy chọn một kiểu và dùng xuyên suốt:
  - Kiểu 1: `💬・trò-chuyện`
  - Kiểu 2: `💬︱trò-chuyện`
  - Kiểu 3: `💬 | trò-chuyện`
- **Hạn chế viết hoa toàn bộ ký tự tên kênh:** Discord tự động chuyển tên kênh văn bản thành chữ thường. Việc cố ép font chữ Unicode kỳ lạ thường gây lỗi hiển thị trên thiết bị Android hoặc máy tính cũ.
- **Emoji đại diện:** Đặt 1 emoji biểu trưng ở đầu tên kênh để tạo điểm nhấn thị giác, không nên nhồi nhét 3-4 emoji liên tiếp.',
  'Discord Architect Team', 'Senior Community Manager', 6, 'kênh, danh mục, giao diện, cấu trúc, forum, voice', 1420, 1, '2026-03-01', '2026-09-15'
);

-- Phân mục bài 1
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order) VALUES
(1, 'tam-quan-trong-cua-kien-truc-kenh-chuan', '1. Tầm quan trọng của kiến trúc kênh chuẩn', 2, 1),
(1, 'mo-hinh-phan-nhom-danh-muc-5-tang-chuan', '2. Mô hình phân nhóm danh mục 5 tầng chuẩn', 2, 2),
(1, 'quy-tac-dat-ten-kenh-truc-quan-va-dong-bo', '3. Quy tắc đặt tên kênh trực quan và đồng bộ', 2, 3);


-- Bài 2: Phân quyền & Ma trận Roles
INSERT INTO articles (
  id, category_id, slug, title, summary, content, author, author_title, reading_time, tags, views, is_featured, published_at, updated_at
) VALUES (
  2, 2, 'ma-tran-vai-tro-role-hierarchy-va-nguyen-tac-least-privilege',
  'Thiết Lập Ma Trận Vai Trò (Role Hierarchy) Và Nguyên Tắc Phân Quyền Tối Thiểu',
  'Hướng dẫn thiết lập thứ bậc vai trò (Role Hierarchy), phòng tránh lỗ hổng phân quyền, bảo vệ quyền Administrator và cấu hình quyền kênh an toàn.',
  '## 1. Cơ chế thứ bậc vai trò (Role Hierarchy) trong Discord

Trong Discord, vị trí của một vai trò (Role) trong danh sách quản lý vai trò quyết định ai có quyền tác động lên ai. Vai trò nằm ở vị trí cao hơn sẽ:
- Có thể kick, ban hoặc mute người giữ vai trò nằm thấp hơn (nếu có quyền tương ứng).
- Có thể quản lý và gán các vai trò nằm phía dưới nó.
- **Không bao giờ** có thể can thiệp vào người sở hữu vai trò cao hơn hoặc ngang hàng với mình.

> **Cảnh báo cực kỳ quan trọng:** Không bao giờ đặt bot quản trị hay tài khoản Mod phụ ở vị trí cao hơn Server Owner hoặc các vai trò giám sát tối cao.

---

## 2. Nguyên tắc phân quyền tối thiểu (Least Privilege Principle)

Nguyên tắc phân quyền tối thiểu nêu rõ: **Một tài khoản chỉ được cấp đúng những quyền hạn tối thiểu cần thiết để hoàn thành nhiệm vụ của họ, không hơn.**

### Sai lầm chết người: Bật quyền "Administrator" bừa bãi
Quyền **Administrator** bỏ qua mọi cấu hình quyền kênh, cho phép người dùng xóa kênh, đổi tên server, tạo webhook, xóa tin nhắn và thay đổi mọi cài đặt.
- Chỉ trao quyền này cho Server Owner và người đồng sáng lập cực kỳ tin cậy (đã bật 2FA).
- Ban Moderator **tuyệt đối không cần quyền Administrator**. Họ chỉ cần các quyền cụ thể:
  - `Manage Messages` (Xóa tin nhắn vi phạm).
  - `Timeout Members` (Đình chỉ chat tạm thời).
  - `Kick Members` / `Ban Members` (Loại bỏ kẻ phá hoại).
  - `Mute Members` / `Deafen Members` (Quản lý kênh thoại).

---

## 3. Cấu hình vai trò mặc định @everyone chuẩn xác

Vai trò `@everyone` áp dụng cho mọi người khi mới tham gia máy chủ. Để đảm bảo an toàn, hãy tắt ngay các quyền sau ở cấp độ Server Settings:
- ❌ **TẮT** `Mention @everyone, @here, and All Roles`: Ngăn chặn kẻ xấu ping toàn bộ server để phát tán link lừa đảo.
- ❌ **TẮT** `Create Invite`: Nếu bạn muốn kiểm soát chặt chẽ đường link mời vào server.
- ❌ **TẮT** `Manage Nicknames`: Tránh việc thành viên tự đổi tên nhạy cảm mạo danh Admin.
- ❌ **TẮT** `Send Voice Messages`: Tránh spam tin nhắn thoại gây phiền toái.
- ✅ **BẬT** `View Channels`, `Send Messages`, `Read Message History`, `Add Reactions` (hoặc chỉ bật ở các kênh được chỉ định).

---

## 4. Mô hình 4 lớp vai trò khuyến nghị

1. **Owner / Co-Owner (Cấp 1):** Quyền tối cao, sở hữu máy chủ, toàn quyền quyết định.
2. **Senior Staff / Head Mod (Cấp 2):** Giám sát đội ngũ Mod, quản lý bot, xử lý các tình huống phức tạp.
3. **Moderator & Helper (Cấp 3):** Trực tiếp kiểm duyệt tin nhắn, hỗ trợ giải đáp thắc mắc, giải quyết ticket.
4. **Verified Member (Cấp 4):** Thành viên đã hoàn thành xác minh Onboarding hoặc vượt qua câu hỏi bảo mật.
5. **@everyone (Mặc định):** Chỉ xem được kênh quy định và màn hình tiếp đón.',
  'Discord Security Specialist', 'Certified Safety Consultant', 7, 'roles, phân quyền, hierarchy, admin, permissions, security', 1890, 1, '2026-03-05', '2026-09-16'
);

-- Phân mục bài 2
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order) VALUES
(2, 'co-che-thu-bac-vai-tro-role-hierarchy-trong-discord', '1. Cơ chế thứ bậc vai trò (Role Hierarchy) trong Discord', 2, 1),
(2, 'nguyen-tac-phan-quyen-toi-thieu-least-privilege-principle', '2. Nguyên tắc phân quyền tối thiểu (Least Privilege)', 2, 2),
(2, 'cau-hinh-vai-tro-mac-dinh-everyone-chuan-xac', '3. Cấu hình vai trò mặc định @everyone chuẩn xác', 2, 3),
(2, 'mo-hinh-4-lop-vai-tro-khuyen-nghi', '4. Mô hình 4 lớp vai trò khuyến nghị', 2, 4);


-- Bài 3: Bảo Mật & Phòng Chống Raid
INSERT INTO articles (
  id, category_id, slug, title, summary, content, author, author_title, reading_time, tags, views, is_featured, published_at, updated_at
) VALUES (
  3, 3, 'phong-thu-da-lop-chong-raid-va-spam-link-lua-dao',
  'Thiết Lập Hệ Thống Phòng Thủ Đa Lớp Chống Raid, Scam Phishing Và Token Grabber',
  'Quy trình bảo mật toàn diện: Thiết lập cấp độ xác minh (Verification Levels), bảo vệ tài khoản 2FA cho Staff, cơ chế khóa server khẩn cấp và chống token grabber.',
  '## 1. Các hình thức tấn công phổ biến vào Discord Server

Một Discord server phát triển sẽ đối mặt với các nguy cơ bảo mật sau:
1. **Server Raid:** Hàng trăm tài khoản clone/bot tràn vào cùng một lúc, spam tin nhắn rác hoặc nội dung độc hại nhằm làm sập hoạt động trò chuyện.
2. **Phishing Scam & Fake Nitro:** Kẻ xấu phát tán tin nhắn mạo danh tặng quà Discord Nitro, link Steam giả mạo để chiếm đoạt tài khoản (Token Grabber).
3. **Compromised Staff Account:** Tài khoản của một Mod hoặc Admin bị lộ mật khẩu, kẻ tấn công dùng quyền của tài khoản đó để xóa kênh và ban toàn bộ thành viên.

---

## 2. Kích hoạt mức bảo mật Verification Level chuẩn

Vào **Server Settings -> Safety Setup -> Verification Level**:
- **Mức Low hoặc Medium:** Tối thiểu nên đặt ở mức `Medium` (Tài khoản phải đăng ký Discord trên 5 phút).
- **Mức High (Khuyến nghị cho server công khai):** Phải là thành viên của server trên 10 phút mới được gửi tin nhắn. Khoảng thời gian 10 phút này đủ để các hệ thống chống raid phát hiện và ngăn chặn bot tự động.
- **Yêu cầu 2FA cho Ban Quản Trị (2FA Requirement for Moderation):** Bắt buộc bật tính năng này! Nếu một Mod không kích hoạt bảo mật 2 lớp trên tài khoản cá nhân, họ sẽ không thể thực hiện các thao tác quản trị.

---

## 3. Quy trình khẩn cấp khi bị tấn công (Server Lockdown Procedure)

Khi xảy ra cuộc tấn công bất ngờ (Raid), ban quản trị cần thao tác nhanh chóng theo 3 bước:

### Bước 1: Thu hồi đường link mời công khai (Pause Invites)
Vào **Server Settings -> Invites -> Pause Invites**. Việc này ngay lập tức chặn đứng làn sóng tài khoản bot mới tràn vào mà không cần phải xóa các link mời vĩnh viễn.

### Bước 2: Tạm khóa quyền gửi tin nhắn của @everyone
Sử dụng bot quản trị có lệnh Lockdown (ví dụ: `?lockdown` trên Carl-bot hoặc Wick bot) hoặc chỉnh quyền `@everyone` tắt `Send Messages` tại các kênh công cộng đang bị spam.

### Bước 3: Dọn dẹp tin nhắn và trừng phạt tự động
Sử dụng lệnh xóa hàng loạt tin nhắn: `?purge 100` hoặc lệnh ban theo ID danh sách bot.',
  'CyberSec Community Lead', 'Incident Response Lead', 8, 'bảo mật, chống raid, anti-raid, 2fa, verification, phishing, lockdown', 2150, 1, '2026-03-10', '2026-09-17'
);

-- Phân mục bài 3
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order) VALUES
(3, 'cac-hinh-thuc-tan-cong-pho-bien-vao-discord-server', '1. Các hình thức tấn công phổ biến', 2, 1),
(3, 'kich-hoat-muc-bao-mat-verification-level-chuan', '2. Kích hoạt mức bảo mật Verification Level', 2, 2),
(3, 'quy-trinh-khan-cap-khi-bi-tan-cong-server-lockdown-procedure', '3. Quy trình khẩn cấp khi bị tấn công (Lockdown)', 2, 3);


-- Bài 4: Discord AutoMod
INSERT INTO articles (
  id, category_id, slug, title, summary, content, author, author_title, reading_time, tags, views, is_featured, published_at, updated_at
) VALUES (
  4, 3, 'thiet-lap-discord-automod-va-bo-loc-tu-dong',
  'Hướng Dẫn Cấu Hình Toàn Diện Discord AutoMod: Regex, Bộ Lọc Từ Khóa Và Chặn Spam Link',
  'Khai thác tối đa sức mạnh của tính năng AutoMod có sẵn trong Discord để tự động chặn từ khóa nhạy cảm, chặn link mời server khác và ngăn ngừa spam liên tục.',
  '## 1. Ưu điểm vượt trội của Discord AutoMod có sẵn

Trước đây, người quản trị phải phụ thuộc vào bot bên thứ ba để lọc từ khóa. Tuy nhiên, tính năng **AutoMod tích hợp sẵn của Discord** sở hữu những lợi thế độc nhất:
- **Tốc độ chặn tức thì (Sub-millisecond):** Tin nhắn vi phạm bị chặn ngay tại máy chủ Discord trước khi kịp hiển thị trên màn hình người khác.
- **Không bao giờ bị lỗi sập bot (0% Downtime):** Hoạt động liên tục 24/7 trực tiếp từ hệ thống của Discord.
- **Gửi thông báo cảnh báo riêng cho người vi phạm:** Giúp họ hiểu lý do tin nhắn bị chặn mà không gây ức chế.

---

## 2. Thiết lập 4 quy tắc AutoMod quan trọng nhất

Vào **Server Settings -> AutoMod**:

### Quy tắc 1: Chặn nội dung lừa đảo và liên kết nguy hại (Block Mention Spam)
- Giới hạn số lượng @mention trong một tin nhắn (Khuyên dùng: Tối đa 3 - 5 người).
- Bất kỳ tài khoản nào vượt quá ngưỡng này sẽ bị hệ thống tự động gắn cờ Timeout 1 giờ.

### Quy tắc 2: Chặn liên kết mời vào các Discord khác (Block Discord Invites)
- Chọn mục **Block Server Invites**.
- Thêm các kênh được miễn trừ (Exempt Channels) như kênh `#giao-lưu-server` hoặc vai trò Staff để cho phép gửi link hợp lệ khi cần.

### Quy tắc 3: Bộ từ khóa cấm tùy chỉnh (Custom Keyword Rule)
- Nhập danh sách các từ ngữ lăng mạ, phân biệt đối xử, từ khóa nhạy cảm.
- Kích hoạt tính năng **Regex Match (Biểu thức chính quy)** để chặn các cách lách chữ (ví dụ: dùng số thay chữ cái hoặc chèn dấu chấm giữa các chữ cái).

---

## 3. Cấu hình hành động phản hồi (Automated Responses)
Khi một quy tắc AutoMod bị kích hoạt, bạn có thể thiết lập:
1. `Block Message`: Không cho phép tin nhắn xuất hiện.
2. `Send Alert Message`: Báo cáo vi phạm về kênh riêng `#automod-logs` kèm nội dung đầy đủ để Mod xem xét.
3. `Timeout Member`: Tạm khóa chat của người vi phạm từ 60 giây đến 24 giờ tùy mức độ nghiêm trọng.',
  'Discord Tech Specialist', 'Community Safety Manager', 5, 'automod, bộ lọc, regex, chặn spam, cấu hình, discord safe', 1120, 0, '2026-03-12', '2026-09-14'
);

-- Phân mục bài 4
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order) VALUES
(4, 'uu-diem-vuot-troi-cua-discord-automod-co-san', '1. Ưu điểm vượt trội của Discord AutoMod', 2, 1),
(4, 'thiet-lap-4-quy-tac-automod-quan-trong-nhat', '2. Thiết lập 4 quy tắc AutoMod quan trọng', 2, 2),
(4, 'cau-hinh-hanh-dong-phan-hoi-automated-responses', '3. Cấu hình hành động phản hồi tự động', 2, 3);


-- Bài 5: Hệ sinh thái Bot
INSERT INTO articles (
  id, category_id, slug, title, summary, content, author, author_title, reading_time, tags, views, is_featured, published_at, updated_at
) VALUES (
  5, 4, 'top-bot-thiet-yeu-va-cach-tich-hop-an-toan',
  'Top Các Bot Thiết Yếu Cho Discord Server Và Nguyên Tắc Tích Hợp An Toàn',
  'Đánh giá và hướng dẫn cấu hình các bot hàng đầu: Carl-bot, Dyno, Ticket Tool, Wick, cùng các quy tắc bảo mật khi cấp quyền cho bot thứ ba.',
  '## 1. Tiêu chí lựa chọn bot chất lượng cao

Không nên cài đặt quá nhiều bot có tính năng trùng lặp. Mỗi máy chủ tiêu chuẩn chỉ cần 3 - 5 bot chuyên biệt:
- **Độ tin cậy & Uptime:** Bot đã được Discord xác minh (Verified Bot Checkmark).
- **Phân quyền tối giản:** Không bao giờ mời bot với đường link cấp sẵn quyền `Administrator`.
- **Bảng điều khiển (Dashboard web):** Có giao diện web trực quan để cấu hình thay vì chỉ gõ lệnh text.

---

## 2. Top bot thiết yếu cho từng nhu cầu

### 1. Carl-bot (Quản trị & Nhật ký Log toàn diện)
- **Điểm mạnh:** Hệ thống Logging mạnh mẽ nhất hiện nay (ghi lại tin nhắn bị xóa, tin nhắn bị sửa, ai rời/vào server, ai đổi vai trò).
- **Reaction Roles:** Hỗ trợ tạo menu chọn vai trò cực kỳ mượt mà.

### 2. Ticket Tool (Hệ thống hỗ trợ chuyên nghiệp)
- Giúp thành viên tạo kênh chat riêng tư 1-1 với Ban Quản Trị khi cần khiếu nại, báo lỗi hoặc mua bán/hỗ trợ dịch vụ.
- Tự động lưu bản ghi chat (Transcript) sau khi đóng ticket để làm bằng chứng khi có tranh chấp.

### 3. Wick Bot (Chuyên gia chống nuke & bảo mật)
- Khả năng phát hiện hành vi xóa kênh hàng loạt, ban thành viên hàng loạt và ngay lập tức tước quyền của tài khoản vi phạm chỉ sau vài mili-giây.

---

## 3. Quy tắc an toàn khi phân quyền cho Bot

1. **Kiểm tra URL mời bot (OAuth2 URL):** Đảm bảo bạn đang mời bot từ trang web chính thức, kiểm tra kỹ ID của bot.
2. **Vị trí của vai trò Bot:** Đặt vai trò của bot ở vị trí vừa đủ cao để quản lý các thành viên thông thường, nhưng **luôn nằm dưới vai trò của Ban Quản Trị cấp cao**.',
  'Bot Engineering Lead', 'Discord Developer Partner', 6, 'bot, carl-bot, dyno, ticket, wick, webhook, tự động hóa', 1670, 1, '2026-03-14', '2026-09-17'
);

-- Phân mục bài 5
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order) VALUES
(5, 'tieu-chi-lua-chon-bot-chat-luong-cao', '1. Tiêu chí lựa chọn bot chất lượng cao', 2, 1),
(5, 'top-bot-thiet-yeu-cho-tung-nhu-cau', '2. Top bot thiết yếu cho từng nhu cầu', 2, 2),
(5, 'quy-tac-an-toan-khi-phan-quyen-cho-bot', '3. Quy tắc an toàn khi phân quyền cho Bot', 2, 3);


-- Bài 6: Onboarding
INSERT INTO articles (
  id, category_id, slug, title, summary, content, author, author_title, reading_time, tags, views, is_featured, published_at, updated_at
) VALUES (
  6, 5, 'thiet-lap-discord-community-onboarding-chuyen-nghiep',
  'Thiết Lập Tính Năng Discord Onboarding: Quy Trình Đón Tiếp Thành Viên Chuẩn Quốc Tế',
  'Thay thế các bot reaction role truyền thống bằng tính năng Discord Onboarding gốc: Đặt câu hỏi khảo sát nhận role, hiển thị danh mục theo sở thích và kênh việc cần làm.',
  '## 1. Tại sao Discord Onboarding là tính năng bắt buộc phải có?

Trước đây, khi người dùng mới vào server, họ phải đọc một bức tường văn bản dài dặc rồi tự tìm emoji để bấm nhận role. Tỷ lệ bỏ cuộc (Drop-off rate) ở bước này lên đến 60%.

Với **Discord Onboarding (Kích hoạt sau khi bật tính năng Community Server)**:
- Người dùng được hiển thị giao diện chào đón tương tác ngay từ khi bấm link mời.
- Tự động gợi ý các kênh chat phù hợp với sở thích của từng người.
- Ẩn bớt các kênh không liên quan để tránh tình trạng ngợp thông tin.

---

## 2. Các bước cấu hình Onboarding chuẩn

Vào **Server Settings -> Onboarding**:

### Bước 1: Thiết lập kênh mặc định (Default Channels)
Chọn từ 5 - 7 kênh bắt buộc mà mọi thành viên đều nhìn thấy khi mới tham gia (ví dụ: `#quy-định`, `#thông-báo`, `#trò-chuyện-chung`).

### Bước 2: Tạo câu hỏi tùy chọn kênh & vai trò (Customization Questions)
Tạo 2 đến 3 câu hỏi súc tích:
- **Câu hỏi 1: Sở thích chính của bạn tại server là gì?**
  - Lựa chọn A: Lập trình web & App -> Tự động mở danh mục `💻 LẬP TRÌNH` và gán role `@Dev`.
  - Lựa chọn B: Chơi game giao lưu -> Tự động mở danh mục `🎮 GAMING` và gán role `@Gamer`.
  - Lựa chọn C: Học tập & chia sẻ kinh nghiệm -> Gán role tương ứng.
- **Câu hỏi 2: Bạn muốn nhận thông báo về nội dung nào?**
  - Nhận tin tức cập nhật mới.
  - Nhận thông báo sự kiện minigame & giveaway.

### Bước 3: Thiết lập Hướng dẫn khởi đầu (Server Guide / To-do list)
Hiển thị danh sách 3 nhiệm vụ ngắn gọn khuyến khích thành viên mới thực hiện:
1. Đọc lướt nội quy máy chủ.
2. Gửi lời chào đầu tiên tại `#trò-chuyện-chung`.
3. Giới thiệu bản thân ngắn gọn.',
  'Community Experience Designer', 'Discord Onboarding Strategist', 6, 'onboarding, welcome, server guide, community, role reaction', 1340, 0, '2026-03-18', '2026-09-16'
);

-- Phân mục bài 6
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order) VALUES
(6, 'tai-sao-discord-onboarding-la-tinh-nang-bat-buoc-phai-co', '1. Tại sao Discord Onboarding là bắt buộc?', 2, 1),
(6, 'cac-buoc-cau-hinh-onboarding-chuan', '2. Các bước cấu hình Onboarding chuẩn', 2, 2);


-- Bài 7: Quản trị Mod Team
INSERT INTO articles (
  id, category_id, slug, title, summary, content, author, author_title, reading_time, tags, views, is_featured, published_at, updated_at
) VALUES (
  7, 6, 'so-tay-dao-tao-va-dieu-hanh-doi-ngu-moderator',
  'Sổ Tay Tuyển Chọn, Đào Tạo Và Điều Hành Đội Ngũ Moderator Chuyên Nghiệp',
  'Xây dựng văn hóa quản trị lành mạnh: Bảng bậc phạt lũy tiến (Infraction Ladder), phân ca trực, kênh điều hành nội bộ và cách giải quyết xung đột công tâm.',
  '## 1. Tiêu chí tuyển chọn Moderator

Đừng bao giờ chọn một người làm Moderator chỉ vì họ chat rất nhiều hoặc là bạn bè thân thiết. Một Moderator xuất sắc cần có:
- **Cái đầu lạnh và tính khách quan:** Không để cảm xúc cá nhân chi phối khi xử lý vi phạm.
- **Hiểu sâu sắc các quy tắc của Discord ToS và Guidelines:** Đảm bảo server không bị Discord xử phạt hay đánh sập.
- **Kỹ năng giao tiếp điềm đạm:** Có khả năng giải thích lý do xử phạt một cách văn minh, tránh đôi co cãi vã tại kênh công cộng.

---

## 2. Thang trừng phạt lũy tiến (Infraction Ladder)

Để đảm bảo tính minh bạch và công bằng, đội ngũ Mod phải tuân thủ nghiêm ngặt bậc thang xử phạt sau:

1. **Bậc 1: Cảnh cáo riêng tư (Warn):** Dành cho các lỗi nhỏ lần đầu (nhầm kênh, spam nhẹ). Nhắc nhở văn minh qua tin nhắn hoặc lệnh bot.
2. **Bậc 2: Đình chỉ chat tạm thời (Timeout):** Nếu tiếp tục tái phạm sau khi đã nhắc nhở. Thời gian timeout: 5 phút đến 1 giờ.
3. **Bậc 3: Đình chỉ chat kéo dài (Mute/Timeout 24h):** Áp dụng cho hành vi gây hấn, xúc phạm người khác có chủ đích.
4. **Bậc 4: Đuổi khỏi server (Kick):** Dành cho thành viên không có tinh thần hòa nhập nhưng vi phạm chưa đến mức nghiêm trọng. Họ vẫn có thể quay lại nếu thay đổi thái độ.
5. **Bậc 5: Cấm vĩnh viễn (Permanent Ban):** Áp dụng ngay lập tức cho các hành vi: Phát tán link lừa đảo/scam, quấy rối độc hại, phát tán nội dung cấm theo ToS.',
  'Community Operations Manager', 'Head of Moderation', 7, 'moderator, mod team, quản trị, điều hành, xử phạt, nhân sự', 1580, 1, '2026-03-22', '2026-09-17'
);

-- Phân mục bài 7
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order) VALUES
(7, 'tieu-chi-tuyen-chon-moderator', '1. Tiêu chí tuyển chọn Moderator', 2, 1),
(7, 'thang-trung-phat-luy-tien-infraction-ladder', '2. Thang trừng phạt lũy tiến (Infraction Ladder)', 2, 2);


-- Bài 8: Giữ lửa và tăng trưởng
INSERT INTO articles (
  id, category_id, slug, title, summary, content, author, author_title, reading_time, tags, views, is_featured, published_at, updated_at
) VALUES (
  8, 6, 'chien-luoc-giu-lua-va-tang-truong-thanh-vien-ben-vung',
  'Chiến Lược Giữ Lửa Tương Tác Và Tăng Trưởng Thành Viên Bền Vững Cho Server',
  'Phương pháp duy trì nhịp trò chuyện tự nhiên, tổ chức sự kiện Game Night/Stage AMA, cơ chế cấp bậc tích lũy kinh nghiệm và tối ưu hóa Discord Server Discovery.',
  '## 1. Giải quyết vấn đề "Server bị đóng băng" (Dead Chat)

Server vắng lặng là nỗi ám ảnh lớn nhất của các quản trị viên. Để kích hoạt lại dòng thảo luận:
- **Đặt câu hỏi gợi mở hàng ngày (Question of the Day):** Sử dụng bot hoặc kênh riêng để đăng câu hỏi về chủ đề hot trong ngày.
- **Tận dụng kênh Diễn Đàn (Forum Channels):** Khác với kênh chat thông thường nơi tin nhắn bị trôi rất nhanh, kênh Forum giúp lưu giữ các chủ đề thảo luận sâu sắc, hướng dẫn hay để thành viên tìm lại bất kỳ lúc nào.
- **Hạn chế việc Ban Quản Trị chỉ xuất hiện khi đi phạt:** Hãy tích cực tham gia trò chuyện như một thành viên bình thường để tạo sự gần gũi.

---

## 2. Tổ chức sự kiện định kỳ (Community Events)

- **Voice Stage AMA / Tọa đàm:** Mời các khách mời có chuyên môn chia sẻ về chủ đề mà cộng đồng quan tâm.
- **Game Night cuối tuần:** Tổ chức chơi các tựa game vui nhộn dễ tiếp cận như Gartic Phone, Among Us, Skribbl.io, Goose Goose Duck.
- **Sự kiện vinh danh (Member of the Month):** Gán vai trò đặc biệt và đổi màu tên cho những thành viên có đóng góp tích cực nhất trong tháng.',
  'Growth Community Strategist', 'Community Ambassador', 5, 'tăng trưởng, tương tác, sự kiện, game night, diễn đàn, gắn kết', 1290, 0, '2026-03-25', '2026-09-17'
);

-- Phân mục bài 8
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order) VALUES
(8, 'giai-quyet-van-de-server-bi-dong-bang-dead-chat', '1. Giải quyết vấn đề "Server bị đóng băng"', 2, 1),
(8, 'to-chuc-su-kien-dinh-ky-community-events', '2. Tổ chức sự kiện định kỳ (Community Events)', 2, 2);
