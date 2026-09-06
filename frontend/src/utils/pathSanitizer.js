/**
 * Chuyển đổi tất cả các ký tự đặc biệt nguy hiểm thành dạng chuỗi an toàn cho File System & URL
 */
export const sanitizePathString = (str) => {
  if (!str) return '';
  return String(str)
    .replaceAll('#', '_hash_')
    .replaceAll('?', '_qmark_')
    .replaceAll('!', '_excl_')
    .replaceAll(':', '_colon_')
    .replaceAll(';', '_semi_')
    .replaceAll('<', '_lt_')
    .replaceAll('>', '_gt_')
    .replaceAll('*', '_star_')
    .replaceAll('"', '_quote_')
    .replaceAll('|', '_pipe_');
};